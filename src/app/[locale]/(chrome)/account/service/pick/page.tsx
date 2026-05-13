import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import FleetMachinePicker, {
  type PickableMachine,
} from "@/components/service/FleetMachinePicker";
import {
  listCustomerMachines,
  warrantyStatus,
  type WarrantyStatus,
} from "@/lib/fleet";
import type { ServiceCaseKind } from "@/lib/service";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ kind?: string }>;
}

function normKind(raw: string | undefined): ServiceCaseKind {
  if (raw === "inspection") return "inspection";
  return "repair";
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "service" });
  return {
    title: t("pick.metaTitle"),
    description: t("pick.metaDescription"),
  };
}

export default async function ServicePickEquipmentPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  const cookieStore = await cookies();
  if (!cookieStore.get("swr_customer_token")?.value) {
    redirect(`/${locale}/account/login`);
  }

  const kind = normKind(sp.kind);
  const t = await getTranslations({ locale, namespace: "service" });

  const pickableMachines: PickableMachine[] = (await listCustomerMachines()).map(
    (m) => {
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
    },
  );

  const manualHref = `/account/service/new?kind=${kind}&manual=1` as const;

  return (
    <div className="swr-page-shell py-10 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/account/service"
          className="text-xs font-bold uppercase tracking-[0.12em] text-secondary hover:underline"
        >
          ← {t("backToHub")}
        </Link>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
          {t("pick.stepLabel")}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-[-0.02em] uppercase">
          {t(`pick.${kind}.heading`)}
        </h1>
        <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
          {t(`pick.${kind}.subheading`)}
        </p>
      </div>

      <FleetMachinePicker
        kind={kind}
        machines={pickableMachines}
        locale={locale}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/orders"
          className="flex flex-col gap-2 p-6 bg-surface-container-low transition-colors hover:bg-primary-fixed"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
            {t("pick.altOrder.eyebrow")}
          </span>
          <span className="text-base font-bold text-primary">
            {t("pick.altOrder.title")}
          </span>
          <span className="text-sm text-on-surface-variant leading-relaxed">
            {t("pick.altOrder.body")}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-primary mt-1">
            {t("pick.altOrder.cta")} ›
          </span>
        </Link>

        <Link
          href={manualHref}
          className="flex flex-col gap-2 p-6 bg-surface-container-low transition-colors hover:bg-primary-fixed"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
            {t("pick.altManual.eyebrow")}
          </span>
          <span className="text-base font-bold text-primary">
            {t("pick.altManual.title")}
          </span>
          <span className="text-sm text-on-surface-variant leading-relaxed">
            {t("pick.altManual.body")}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-primary mt-1">
            {t("pick.altManual.cta")} ›
          </span>
        </Link>
      </div>

      <p className="text-sm text-on-surface-variant max-w-2xl">
        <Link
          href="/account/fleet"
          className="font-bold text-primary hover:underline"
        >
          {t("pick.fleetLink")}
        </Link>
      </p>
    </div>
  );
}
