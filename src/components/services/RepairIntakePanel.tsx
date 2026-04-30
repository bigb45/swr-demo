import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import RepairRequestForm from "@/components/services/RepairRequestForm";

interface RepairIntakePanelProps {
  locale: string;
}

/**
 * Public repair page: business customers (session) get links to fleet + account repair intake;
 * guests use the mailto form. See Phase 6 / BACKLOG — guest vs login.
 */
export default async function RepairIntakePanel({ locale }: RepairIntakePanelProps) {
  const t = await getTranslations({ locale, namespace: "services.repair" });
  const hasSession = Boolean(
    (await cookies()).get("swr_customer_token")?.value,
  );

  const formLabels = {
    heading: t("form.heading"),
    subheading: t("form.subheading"),
    machineMake: t("form.machineMake"),
    machineModel: t("form.machineModel"),
    serial: t("form.serial"),
    fault: t("form.fault"),
    contactName: t("form.contactName"),
    company: t("form.company"),
    phone: t("form.phone"),
    email: t("form.email"),
    submit: t("form.submit"),
    note: t("form.note"),
  } as const;

  if (hasSession) {
    return (
      <div className="flex flex-col gap-6">
        <div
          className="p-6 sm:p-8 bg-surface-container-low flex flex-col gap-3"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          <h3 className="text-lg font-black uppercase tracking-[-0.01em] text-primary">
            {t("intake.title")}
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t("intake.body")}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/account/fleet"
              className="inline-flex items-center justify-center px-4 py-3 text-xs font-bold uppercase tracking-wider border border-primary text-primary hover:bg-primary-fixed transition-colors"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              {t("intake.ctaFleet")}
            </Link>
            <Link
              href="/account/service/pick?kind=repair"
              className="inline-flex items-center justify-center px-4 py-3 text-xs font-bold uppercase tracking-wider bg-secondary text-white hover:brightness-110"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              {t("intake.ctaRepair")}
            </Link>
            <Link
              href="/account/service"
              className="inline-flex items-center justify-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-primary"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              {t("intake.ctaServiceHub")}
            </Link>
          </div>
        </div>
        <p className="text-[11px] text-on-surface-variant leading-relaxed">
          {t("intake.guestHint")}
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">
            {t("intake.guestTitle")}
          </p>
          <RepairRequestForm
            recipientEmail={t("form.recipientEmail")}
            labels={formLabels}
          />
        </div>
      </div>
    );
  }

  return (
    <RepairRequestForm
      recipientEmail={t("form.recipientEmail")}
      labels={formLabels}
    />
  );
}
