import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import NewCaseForm, {
  type NewCaseContext,
  type OrderLineChoice,
} from "@/components/service/NewCaseForm";
import FleetMachinePicker, {
  type PickableMachine,
} from "@/components/service/FleetMachinePicker";
import { getOrderForCustomer } from "@/lib/orders";
import {
  getCustomerMachine,
  listCustomerMachines,
  warrantyStatus,
  type Machine,
  type WarrantyStatus,
} from "@/lib/fleet";
import {
  RETURN_REASONS,
  REPAIR_REASONS,
  type ServiceCaseKind,
  type ServiceCaseReason,
} from "@/lib/service";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    kind?: string;
    orderId?: string;
    machineId?: string;
    /** Skip equipment picker: user chose &quot;not listed&quot; on /account/service/pick */
    manual?: string;
  }>;
}

function normalizeKind(raw: string | undefined): ServiceCaseKind {
  if (raw === "repair" || raw === "inspection") return raw;
  return "return";
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "service" });
  return {
    title: t("new.metaTitle"),
    description: t("new.metaDescription"),
  };
}

export default async function NewServiceCasePage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) redirect(`/${locale}/account/login`);

  const kind = normalizeKind(sp.kind);
  const t = await getTranslations({ locale, namespace: "service" });

  if (
    (kind === "repair" || kind === "inspection") &&
    !sp.machineId &&
    !sp.orderId &&
    sp.manual !== "1"
  ) {
    redirect(
      `/${locale}/account/service/pick?kind=${encodeURIComponent(kind)}`,
    );
  }

  // Build context
  const context: NewCaseContext = {};
  let selectedMachine: Machine | null = null;

  if (sp.orderId) {
    const order = await getOrderForCustomer(sp.orderId, token);
    if (order) {
      context.orderId = String(order.entity_id);
      context.orderIncrementId = order.increment_id;
      const items: OrderLineChoice[] = order.items
        .filter((i) => i.qty_ordered > 0 && i.sku)
        .map((i) => ({
          sku: i.sku,
          name: i.name,
          maxQty: Math.max(1, Math.floor(Number(i.qty_ordered) || 0)),
        }));
      context.orderItems = items;
    }
  }

  if (sp.machineId) {
    const machine = await getCustomerMachine(sp.machineId);
    if (machine) {
      selectedMachine = machine;
      context.machineId = machine.id;
      context.machineLabel = `${machine.brand} ${machine.model}`;
      context.serial = machine.serial;
    }
  }

  // For repair / inspection cases without a preselected machine, offer the
  // fleet picker so the user can one-click attach a machine they own (with
  // warranty status visible) instead of free-typing into the form.
  const showFleetPicker =
    (kind === "repair" || kind === "inspection") && !context.machineId;

  const pickableMachines: PickableMachine[] = showFleetPicker
    ? (await listCustomerMachines()).map((m) => {
        const sorted = [...m.maintenance].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        const warranty: WarrantyStatus = warrantyStatus(m);
        return {
          id: m.id,
          brand: m.brand,
          model: m.model,
          serial: m.serial,
          warranty,
          warrantyUntil: m.warrantyUntil,
          lastServiceAt: sorted[0]?.date,
        };
      })
    : [];

  const reasons: ServiceCaseReason[] =
    kind === "return" ? RETURN_REASONS : REPAIR_REASONS;
  const reasonLabels = (
    [
      "damaged_in_transit",
      "defective",
      "wrong_item",
      "not_needed",
      "warranty",
      "breakdown",
      "calibration",
      "other",
    ] as ServiceCaseReason[]
  ).reduce(
    (acc, r) => ({ ...acc, [r]: t(`reason.${r}`) }),
    {} as Record<ServiceCaseReason, string>,
  );

  const dateShort = (iso: string) =>
    new Intl.DateTimeFormat(
      locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
      { year: "numeric", month: "short", day: "numeric" },
    ).format(new Date(iso));

  const itemsHeading =
    kind === "return"
      ? t("new.itemsHeading")
      : kind === "repair"
        ? t("new.itemsHeadingRepair")
        : t("new.itemsHeadingInspection");
  const itemsHint =
    kind === "return"
      ? t("new.itemsHint")
      : kind === "repair"
        ? t("new.itemsHintRepair")
        : t("new.itemsHintInspection");
  const itemQty =
    kind === "return"
      ? t("new.itemQty")
      : kind === "repair"
        ? t("new.itemQtyRepair")
        : t("new.itemQtyInspection");

  const newCaseQuery = (k: string) => {
    const p = new URLSearchParams();
    p.set("kind", k);
    if (sp.orderId) p.set("orderId", sp.orderId);
    return p.toString();
  };

  const mW = selectedMachine ? warrantyStatus(selectedMachine) : null;

  return (
    <div className="swr-page-shell py-10 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/account/service"
          className="text-xs font-bold uppercase tracking-[0.12em] text-secondary hover:underline"
        >
          ← {t("backToHub")}
        </Link>
        <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-[-0.02em] uppercase">
          {t(`new.${kind}.heading`)}
        </h1>
        <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
          {t(`new.${kind}.subheading`)}
        </p>
      </div>

      {/* Context summary */}
      {context.orderIncrementId || context.machineLabel ? (
        <div
          className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 bg-primary-fixed text-primary"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          {context.orderIncrementId ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                {t("new.contextOrder")}
              </span>
              <Link
                href={`/orders/${context.orderId}`}
                className="text-sm font-bold hover:underline"
              >
                #{context.orderIncrementId}
              </Link>
            </div>
          ) : null}
          {context.machineLabel ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                {t("new.contextMachine")}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Link
                  href={`/account/fleet/${context.machineId}`}
                  className="text-sm font-bold hover:underline"
                >
                  {context.machineLabel}
                  {context.serial ? (
                    <span className="font-mono font-normal ml-2 text-xs opacity-80">
                      {context.serial}
                    </span>
                  ) : null}
                </Link>
                {kind !== "return" ? (
                  <Link
                    href={
                      sp.orderId
                        ? `/account/service/new?${newCaseQuery(kind)}`
                        : `/account/service/pick?kind=${encodeURIComponent(kind)}`
                    }
                    replace
                    className="text-[10px] font-bold uppercase tracking-widest underline opacity-80 hover:opacity-100"
                  >
                    {t("new.contextBanner.changeMachine")}
                  </Link>
                ) : null}
              </div>
              {mW && selectedMachine ? (
                <p className="text-xs opacity-90 mt-1">
                  <span className="font-bold">{t(`new.picker.warranty.${mW}`)}</span>
                  <span className="mx-1.5">·</span>
                  {t("new.picker.warrantyUntil")}{" "}
                  {dateShort(selectedMachine.warrantyUntil)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <NewCaseForm
        kind={kind}
        locale={locale}
        reasons={reasons}
        context={context}
        showManualMachineFields={showFleetPicker}
        pickerSlot={
          showFleetPicker ? (
            <FleetMachinePicker
              kind={kind}
              machines={pickableMachines}
              locale={locale}
              orderId={context.orderId}
              labels={{
                heading: t("new.picker.heading"),
                subheading: t("new.picker.subheading"),
                selectCta: t("new.picker.selectCta"),
                warranty: {
                  active: t("new.picker.warranty.active"),
                  expiring: t("new.picker.warranty.expiring"),
                  expired: t("new.picker.warranty.expired"),
                },
                warrantyUntil: t("new.picker.warrantyUntil"),
                serial: t("new.picker.serial"),
                lastService: t("new.picker.lastService"),
                noService: t("new.picker.noService"),
                empty: {
                  heading: t("new.picker.empty.heading"),
                  body: t("new.picker.empty.body"),
                  cta: t("new.picker.empty.cta"),
                },
              }}
            />
          ) : null
        }
        labels={{
          formIntro:
            kind === "repair" || kind === "inspection"
              ? t("new.formIntroRepair")
              : undefined,
          fieldsHeading: t("new.fieldsHeading"),
          description: t("new.description"),
          descriptionHint: t("new.descriptionHint"),
          reason: t("new.reason"),
          reasonChoose: t("new.reasonChoose"),
          reasonLabels,
          itemsHeading,
          itemsHint,
          itemQty,
          contactHeading: t("new.contactHeading"),
          contactName: t("new.contactName"),
          contactEmail: t("new.contactEmail"),
          contactPhone: t("new.contactPhone"),
          attachmentsHeading: t("new.attachmentsHeading"),
          attachmentsHint: t("new.attachmentsHint"),
          attachmentsAdd: t("new.attachmentsAdd"),
          attachmentsSelectedOne: t("new.attachmentsSelectedOne"),
          attachmentsSelectedMany: t("new.attachmentsSelectedMany"),
          attachmentsNote: t("new.attachmentsNote"),
          manualHeading: t("new.notInFleet.heading"),
          manualToggle: t("new.notInFleet.toggle"),
          manualHint: t("new.notInFleet.hint"),
          manualBrand: t("new.notInFleet.brand"),
          manualModel: t("new.notInFleet.model"),
          manualSerial: t("new.notInFleet.serial"),
          submit: t(`new.${kind}.submit`),
          submitting: t("new.submitting"),
          errorMissing: t("new.errorMissing"),
          errorNoItems: t("new.errorNoItems"),
        }}
      />
    </div>
  );
}
