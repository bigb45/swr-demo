import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ServiceCaseRow from "@/components/service/ServiceCaseRow";
import {
  listCustomerCases,
  isTerminalStatus,
  SERVICE_STATUSES,
  type ServiceCaseKind,
  type ServiceCaseStatus,
} from "@/lib/service";

interface ServicePageProps {
  params: Promise<{ locale: string }>;
}

const KINDS: ServiceCaseKind[] = ["return", "repair", "inspection"];

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "service" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ServiceHubPage({ params }: ServicePageProps) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) redirect(`/${locale}/account/login`);

  const t = await getTranslations({ locale, namespace: "service" });
  const cases = await listCustomerCases();

  const open = cases.filter((c) => !isTerminalStatus(c.status));
  const closed = cases.filter((c) => isTerminalStatus(c.status));

  const statusLabels = SERVICE_STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: t(`status.${s}`) }),
    {} as Record<ServiceCaseStatus, string>,
  );
  const kindLabels = KINDS.reduce(
    (acc, k) => ({ ...acc, [k]: t(`kind.${k}`) }),
    {} as Record<ServiceCaseKind, string>,
  );

  const labels = {
    kind: kindLabels,
    status: statusLabels,
    viewCase: t("viewCase"),
    orderLabel: t("orderLabel"),
    machineLabel: t("machineLabel"),
    updated: t("updated"),
  };

  return (
    <div className="swr-page-shell py-10">
      <div className="mx-auto w-full max-w-[1200px] flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/account"
          className="text-xs font-bold uppercase tracking-[0.12em] text-secondary hover:underline"
        >
          ← {t("backToAccount")}
        </Link>
        <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-[-0.02em] uppercase">
          {t("heading")}
        </h1>
        <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
          {t("subheading")}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {KINDS.map((kind) => (
          <Link
            key={kind}
            href={
              kind === "return"
                ? "/account/service/new?kind=return"
                : `/account/service/pick?kind=${kind}`
            }
            className="flex flex-col gap-2 p-5 bg-primary text-white hover:brightness-110 transition-all"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              {t(`actions.${kind}.eyebrow`)}
            </span>
            <span className="text-lg font-black uppercase tracking-[-0.01em]">
              {t(`actions.${kind}.title`)}
            </span>
            <span className="text-xs text-white/80 leading-relaxed">
              {t(`actions.${kind}.body`)}
            </span>
            <span className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-white">
              {t(`actions.${kind}.cta`)} ›
            </span>
          </Link>
        ))}
      </div>

      {/* Counters */}
      {cases.length > 0 ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-outline-variant/40 overflow-hidden"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          {[
            { value: cases.length, label: t("counters.total") },
            { value: open.length, label: t("counters.open") },
            {
              value: cases.filter((c) => c.status === "awaiting_customer")
                .length,
              label: t("counters.awaiting"),
            },
            { value: closed.length, label: t("counters.closed") },
          ].map((c, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest p-5 flex flex-col gap-1"
            >
              <span className="text-2xl font-black text-primary tracking-[-0.02em]">
                {c.value}
              </span>
              <span className="text-xs text-on-surface-variant uppercase tracking-[0.08em]">
                {c.label}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {cases.length === 0 ? (
        <div
          className="p-8 sm:p-10 bg-surface-container-low flex flex-col items-start gap-4 max-w-3xl"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <h2 className="text-xl font-black text-primary uppercase tracking-[-0.01em]">
            {t("empty.heading")}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed max-w-xl">
            {t("empty.body")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/account/service/new?kind=return"
              className="text-xs font-bold uppercase tracking-[0.12em] bg-primary text-white px-4 py-3 hover:bg-primary-container transition-colors"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              {t("empty.ctaReturn")}
            </Link>
            <Link
              href="/account/service/pick?kind=repair"
              className="text-xs font-bold uppercase tracking-[0.12em] text-primary px-4 py-3 hover:bg-surface-container-lowest transition-colors"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              {t("empty.ctaRepair")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {open.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                {t("sections.open")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {open.map((c) => (
                  <ServiceCaseRow
                    key={c.id}
                    case={c}
                    locale={locale}
                    labels={labels}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {closed.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                {t("sections.closed")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {closed.map((c) => (
                  <ServiceCaseRow
                    key={c.id}
                    case={c}
                    locale={locale}
                    labels={labels}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
      </div>
    </div>
  );
}
