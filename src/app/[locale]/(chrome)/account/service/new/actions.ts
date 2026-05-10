"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createCase,
  type ServiceCaseKind,
  type ServiceCaseLineItem,
  type ServiceCaseReason,
} from "@/lib/service";
import { getCustomerEmail, getOrderForCustomer } from "@/lib/orders";
import { getCustomerMachine } from "@/lib/fleet";

import { uploadServiceCaseAttachments } from "@/lib/service-attachment-upload";

// The form posts FormData. Filenames and sizes are always recorded. When
// Magento exposes `SWR_SERVICE_ATTACHMENT_REST_PATH`, bytes are forwarded
// and returned ids are stored on each attachment (`erpAttachmentId`).

function parseKind(raw: unknown): ServiceCaseKind {
  if (raw === "return" || raw === "repair" || raw === "inspection") return raw;
  return "return";
}

function parseReason(
  raw: unknown,
  kind: ServiceCaseKind,
): ServiceCaseReason {
  const all: ServiceCaseReason[] = [
    "damaged_in_transit",
    "defective",
    "wrong_item",
    "not_needed",
    "warranty",
    "breakdown",
    "calibration",
    "other",
  ];
  if (typeof raw === "string" && (all as string[]).includes(raw)) {
    return raw as ServiceCaseReason;
  }
  return kind === "return" ? "defective" : kind === "repair" ? "breakdown" : "calibration";
}

export async function submitServiceCase(
  _prevState: unknown,
  formData: FormData,
): Promise<{
  error?: "missing_required" | "no_order_lines";
  locale?: string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  const locale = String(formData.get("locale") ?? "de");

  if (!token) {
    redirect(`/${locale}/account/login`);
  }

  const kind = parseKind(formData.get("kind"));
  const reason = parseReason(formData.get("reason"), kind);
  const description = String(formData.get("description") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const orderId = (formData.get("orderId") as string) || undefined;
  const machineId = (formData.get("machineId") as string) || undefined;
  const serial = (formData.get("serial") as string) || undefined;

  if (!description || !contactName) {
    return { error: "missing_required", locale };
  }

  const items: ServiceCaseLineItem[] = [];
  // Items arrive as repeated sku/name/qty tuples prefixed by "item_".
  const itemSkus = formData.getAll("item_sku").map(String);
  const itemNames = formData.getAll("item_name").map(String);
  const itemQtys = formData.getAll("item_qty").map(String);
  for (let i = 0; i < itemSkus.length; i++) {
    const qty = Math.max(0, Number(itemQtys[i] ?? 0));
    if (!itemSkus[i] || qty === 0) continue;
    items.push({
      sku: itemSkus[i],
      name: itemNames[i] ?? itemSkus[i],
      qty,
    });
  }

  const fileList: File[] = [];
  const rawFiles = formData.getAll("attachments");
  for (const f of rawFiles) {
    if (f instanceof File && f.size > 0) fileList.push(f);
  }

  const uploaded =
    fileList.length > 0
      ? await uploadServiceCaseAttachments(token, fileList)
      : [];

  const attachmentsMeta: Array<{
    fileName: string;
    sizeBytes: number;
    mimeType: string;
    remoteId?: string;
  }> = [];
  for (let i = 0; i < fileList.length; i++) {
    const f = fileList[i];
    attachmentsMeta.push({
      fileName: f.name,
      sizeBytes: f.size,
      mimeType: f.type || "application/octet-stream",
      remoteId: uploaded[i]?.id,
    });
  }

  // Enrich with server-verified order / machine context so a tampered
  // client cannot attach a case to an order that isn't theirs.
  let orderIncrementId: string | undefined;
  let verifiedOrder: Awaited<ReturnType<typeof getOrderForCustomer>> = null;
  if (orderId) {
    const email = await getCustomerEmail(token);
    verifiedOrder = email ? await getOrderForCustomer(orderId, token) : null;
    if (verifiedOrder) {
      orderIncrementId = verifiedOrder.increment_id;
    }
  }

  if (verifiedOrder) {
    const selectable = verifiedOrder.items.filter(
      (i) => (Number(i.qty_ordered) || 0) > 0 && i.sku,
    );
    if (selectable.length > 0 && items.length === 0) {
      if (kind === "return") {
        return { error: "no_order_lines", locale };
      }
      if (
        (kind === "repair" || kind === "inspection") &&
        !machineId
      ) {
        return { error: "no_order_lines", locale };
      }
    }
  }

  let machineLabel: string | undefined;
  let machineSerial: string | undefined = serial;
  if (machineId) {
    const machine = await getCustomerMachine(machineId);
    if (machine) {
      machineLabel = `${machine.brand} ${machine.model}`;
      machineSerial = machineSerial || machine.serial;
    }
  } else {
    // No fleet machine selected — accept free-text machine details from the
    // "Not in my fleet" fallback so customers can still open a case for a
    // machine that hasn't been registered on their account yet.
    const manualBrand = String(formData.get("manualBrand") ?? "").trim();
    const manualModel = String(formData.get("manualModel") ?? "").trim();
    const manualSerial = String(formData.get("manualSerial") ?? "").trim();
    const combined = [manualBrand, manualModel].filter(Boolean).join(" ");
    if (combined) {
      machineLabel = combined;
    }
    if (manualSerial) {
      machineSerial = manualSerial;
    }
  }

  const created = await createCase({
    kind,
    reason,
    description,
    contactName,
    contactEmail: contactEmail || undefined,
    contactPhone: contactPhone || undefined,
    orderId,
    orderIncrementId,
    machineId,
    machineLabel,
    serial: machineSerial,
    items,
    attachments: attachmentsMeta,
  });

  redirect(`/${locale}/account/service/${created.id}`);
}
