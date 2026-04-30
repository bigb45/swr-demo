import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCustomerMachine, warrantyStatus } from "@/lib/fleet";
import MaintenanceLogTable from "@/components/fleet/MaintenanceLogTable";
import type { MaintenanceKind } from "@/lib/fleet";
import { listCasesForMachine } from "@/lib/service";
import SpecTable from "@/components/ui/SpecTable";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const KINDS: MaintenanceKind[] = ["service", "repair", "calibration", "inspection", "warranty"];

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const machine = await getCustomerMachine(id);
  const t = await getTranslations({ locale, namespace: "fleet" });
  if (!machine) {
    return { title: t("metaTitle") };
  }
  return {
    title: `${machine.brand} ${machine.model} — ${t("metaTitle")}`,
  };
}

export default async function MachinePage({ params }: PageProps) {
  const { id, locale } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) redirect(`/${locale}/account/login`);

  const machine = await getCustomerMachine(id);
  if (!machine) notFound();

  const t = await getTranslations({ locale, namespace: "fleet" });
  const tServices = await getTranslations({ locale, namespace: "services" });
  const tService = await getTranslations({ locale, namespace: "service" });
  const serviceCases = await listCasesForMachine(machine.id);
  const status = warrantyStatus(machine);
  const statusLabel =
    status === "active"
      ? t("card.statusActive")
      : status === "expiring"
        ? t("card.statusExpiring")
        : t("card.statusExpired");
  const statusBg =
    status === "active"
      ? "bg-secondary text-white"
      : status === "expiring"
        ? "bg-warning/10 text-warning"
        : "bg-error/10 text-error";

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-10 flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Link
          href="/account/fleet"
          className="text-xs font-bold uppercase tracking-[0.12em] text-secondary hover:underline"
        >
          ← {t("backToFleet")}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-secondary">
            {machine.brand}
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${statusBg}`}
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            {statusLabel}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-[-0.02em] uppercase">
          {machine.model}
        </h1>
        {machine.notes ? (
          <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            {machine.notes}
          </p>
        ) : null}
      </div>

      {/* Spec block */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="flex flex-col gap-6 min-w-0">
          <dl
            className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-outline-variant/40 overflow-hidden"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            {[
              { dt: t("detail.serial"), dd: machine.serial, mono: true },
              { dt: t("detail.category"), dd: t(`categoryLabels.${machine.category}`) },
              { dt: t("detail.purchased"), dd: formatDate(machine.purchasedAt, locale) },
              { dt: t("detail.warrantyUntil"), dd: formatDate(machine.warrantyUntil, locale) },
              {
                dt: t("detail.maintenanceCount"),
                dd: String(machine.maintenance.length),
              },
              machine.productSku
                ? {
                    dt: t("detail.product"),
                    dd: machine.productSku,
                    link: `/products/${machine.productSku}`,
                  }
                : null,
            ]
              .filter((x): x is NonNullable<typeof x> => x !== null)
              .map((field, i) => (
                <div key={i} className="bg-surface-container-lowest p-4 flex flex-col gap-1">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {field.dt}
                  </dt>
                  <dd
                    className={`text-sm font-semibold text-on-surface ${
                      "mono" in field && field.mono ? "font-mono" : ""
                    }`}
                  >
                    {"link" in field && field.link ? (
                      <Link href={field.link} className="text-primary hover:underline">
                        {field.dd}
                      </Link>
                    ) : (
                      field.dd
                    )}
                  </dd>
                </div>
              ))}
          </dl>
          {machine.specs && machine.specs.length > 0 ? (
            <SpecTable
              header={
                <span className="text-xs font-bold uppercase tracking-[0.12em]">
                  {t("detail.specsTitle")}
                </span>
              }
              columns={[
                { key: "spec", label: t("detail.specsColSpec") },
                { key: "value", label: t("detail.specsColValue") },
              ]}
              rows={machine.specs.map((s) => ({
                spec: s.key,
                value: s.value,
              }))}
            />
          ) : null}
        </div>

        {/* Quick actions */}
        <div
          className="flex flex-col gap-3 p-5 bg-primary text-white"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/70">
            {t("actions.eyebrow")}
          </span>
          <h2 className="text-lg font-black uppercase tracking-[-0.01em]">
            {t("actions.heading")}
          </h2>
          <p className="text-xs text-white/80 leading-relaxed">
            {t("actions.body")}
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <Link
              href={`/account/service/new?kind=repair&machineId=${machine.id}`}
              className="text-xs font-bold uppercase tracking-[0.12em] bg-white text-primary px-4 py-3 text-center hover:bg-white/90 transition-colors"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              {tService("actions.repair.cta")}
            </Link>
            <Link
              href={`/account/service/new?kind=inspection&machineId=${machine.id}`}
              className="text-xs font-bold uppercase tracking-[0.12em] border border-white/40 text-white px-4 py-3 text-center hover:bg-white/10 transition-colors"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              {tService("actions.inspection.cta")}
            </Link>
            <Link
              href="/services/repair"
              className="text-xs font-bold uppercase tracking-[0.12em] text-white/80 hover:text-white underline text-center pt-1"
            >
              {tServices("repair.title")}
            </Link>
          </div>
        </div>
      </section>

      {/* Open service cases for this machine */}
      {serviceCases.length > 0 ? (
        <section className="flex flex-col gap-4">
          <header className="flex flex-col gap-1 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {tService("machineSection.eyebrow")}
            </p>
            <h2 className="text-2xl font-black uppercase text-primary tracking-[-0.02em]">
              {tService("machineSection.heading")}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {tService("machineSection.subheading")}
            </p>
          </header>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {serviceCases.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/account/service/${c.id}`}
                  className="flex flex-col gap-2 p-4 bg-surface-container-lowest hover:bg-primary-fixed transition-colors"
                  style={{
                    borderRadius: "var(--radius-card)",
                    boxShadow: "var(--shadow-ambient)",
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-secondary text-white"
                      style={{ borderRadius: "var(--radius-btn)" }}
                    >
                      {tService(`kind.${c.kind}`)}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-secondary/10 text-secondary"
                      style={{ borderRadius: "var(--radius-btn)" }}
                    >
                      {tService(`status.${c.status}`)}
                    </span>
                    <span className="ml-auto text-xs font-mono text-on-surface-variant">
                      {c.id}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Maintenance log */}
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
            {t("log.eyebrow")}
          </p>
          <h2 className="text-2xl font-black uppercase text-primary tracking-[-0.02em]">
            {t("log.heading")}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t("log.subheading")}
          </p>
        </header>
        <MaintenanceLogTable
          records={machine.maintenance}
          locale={locale}
          labels={{
            columns: {
              date: t("log.columns.date"),
              kind: t("log.columns.kind"),
              title: t("log.columns.title"),
              technician: t("log.columns.technician"),
              document: t("log.columns.document"),
            },
            kinds: KINDS.reduce(
              (acc, k) => ({ ...acc, [k]: t(`log.kinds.${k}`) }),
              {} as Record<MaintenanceKind, string>,
            ),
            empty: t("log.empty"),
            openDocument: t("log.openDocument"),
          }}
        />
      </section>
    </div>
  );
}
