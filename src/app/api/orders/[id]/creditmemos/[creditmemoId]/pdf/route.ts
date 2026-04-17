/**
 * GET /api/orders/[id]/creditmemos/[creditmemoId]/pdf?locale=de
 *
 * Streams a Next.js-generated PDF credit memo for the currently signed-in
 * customer. Ownership is verified against the parent order's customer_email.
 */

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { renderToStream, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import type { Readable } from "node:stream";
import { getCreditmemoForCustomer } from "@/lib/orders";
import CreditmemoPdf from "@/components/orders/CreditmemoPdf";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; creditmemoId: string }> },
) {
  const { id, creditmemoId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await getCreditmemoForCustomer(id, creditmemoId, token);
  if (!result) {
    return new Response("Not found", { status: 404 });
  }

  const localeParam = req.nextUrl.searchParams.get("locale");
  const locale =
    localeParam && routing.locales.includes(localeParam as never)
      ? localeParam
      : routing.defaultLocale;

  const t = await getTranslations({ locale, namespace: "orders" });

  const labels = {
    title: t("creditmemoPdfTitle"),
    creditmemoNumber: t("creditmemoNumber"),
    orderNumber: t("colOrder"),
    date: t("colDate"),
    billingAddress: t("billingAddress"),
    shippingAddress: t("shippingAddress"),
    sameAsBilling: t("sameAsBilling"),
    product: t("colProduct"),
    sku: t("colSku"),
    qty: t("colQty"),
    unitPrice: t("colUnitPrice"),
    rowTotal: t("colRowTotal"),
    subtotal: t("subtotal"),
    tax: t("tax"),
    shipping: t("shipping"),
    adjustment: t("adjustment"),
    refundTotal: t("refundTotal"),
    companyName: "SWR Handelsgesellschaft mbH",
    companyTagline: "Lörrach — Qualität verbindet",
    footer: "SWR Handelsgesellschaft mbH · info@swr-loerrach.de",
  };

  const element = createElement(CreditmemoPdf, {
    creditmemo: result.document,
    order: result.order,
    labels,
    locale,
  }) as unknown as ReactElement<DocumentProps>;

  const pdfStream = (await renderToStream(element)) as Readable;

  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      pdfStream.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      pdfStream.on("end", () => controller.close());
      pdfStream.on("error", (err: Error) => controller.error(err));
    },
    cancel() {
      pdfStream.destroy();
    },
  });

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="SWR-credit-${result.document.increment_id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
