import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ServiceTimeline from "@/components/service/ServiceTimeline";
import {
  getCase,
  SERVICE_STATUSES,
  serviceKindAccent,
  serviceStatusTone,
  type ServiceCaseStatus,
} from "@/lib/service";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const c = await getCase(id);
  const t = await getTranslations({ locale, namespace: "service" });
  if (!c) return { title: t("metaTitle") };
  return { title: `${c.id} — ${t(`kind.${c.kind}`)} · ${t("metaTitle")}` };
}

export default async function ServiceCasePage({ params }: PageProps) {
  const { locale, id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) redirect(`/${locale}/account/login`);

  const c = await getCase(id);
  if (!c) notFound();

  const t = await getTranslations({ locale, namespace: "service" });

  const statusLabels = SERVICE_STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: t(`status.${s}`) }),
    {} as Record<ServiceCaseStatus, string>,
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-10 flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Link
          href="/account/service"
          className="text-xs font-bold uppercase tracking-[0.12em] text-secondary hover:underline"
        >
          ← {t("backToHub")}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${serviceKindAccent(c.kind)}`}
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            {t(`kind.${c.kind}`)}
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${serviceStatusTone(c.status)}`}
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            {t(`status.${c.status}`)}
          </span>
          <span className="text-xs font-mono text-on-surface-variant ml-auto">
            {c.id}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-[-0.02em] uppercase">
          {c.machineLabel ??
            (c.orderIncrementId
              ? `${t("orderLabel")} #${c.orderIncrementId}`
              : t(`kind.${c.kind}`))}
        </h1>
        <p className="text-sm text-on-surface-variant max-w-3xl leading-relaxed">
          {c.description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Facts */}
        <dl
          className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-outline-variant/40 overflow-hidden"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          {[
            { dt: t("detail.opened"), dd: formatDate(c.createdAt, locale) },
            { dt: t("detail.updated"), dd: formatDate(c.updatedAt, locale) },
            { dt: t("detail.reason"), dd: t(`reason.${c.reason}`) },
            c.orderIncrementId
              ? {
                  dt: t("detail.order"),
                  dd: `#${c.orderIncrementId}`,
                  link: `/orders/${c.orderId}`,
                }
              : null,
            c.machineLabel
              ? {
                  dt: t("detail.machine"),
                  dd: c.machineLabel,
                  link: c.machineId
                    ? `/account/fleet/${c.machineId}`
                    : undefined,
                }
              : null,
            c.serial ? { dt: t("detail.serial"), dd: c.serial, mono: true } : null,
            { dt: t("detail.contact"), dd: c.contactName },
            c.contactEmail
              ? { dt: t("detail.email"), dd: c.contactEmail }
              : null,
            c.contactPhone
              ? { dt: t("detail.phone"), dd: c.contactPhone }
              : null,
          ]
            .filter((x): x is NonNullable<typeof x> => x !== null)
            .map((field, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest p-4 flex flex-col gap-1"
              >
                <dt className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {field.dt}
                </dt>
                <dd
                  className={`text-sm font-semibold text-on-surface ${
                    "mono" in field && field.mono ? "font-mono" : ""
                  }`}
                >
                  {"link" in field && field.link ? (
                    <Link
                      href={field.link}
                      className="text-primary hover:underline"
                    >
                      {field.dd}
                    </Link>
                  ) : (
                    field.dd
                  )}
                </dd>
              </div>
            ))}
        </dl>

        {/* Line items if any */}
        {c.items.length > 0 ? (
          <div
            className="flex flex-col gap-3 p-5 bg-surface-container-low"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-secondary">
              {t("detail.items")}
            </h2>
            <ul className="flex flex-col gap-2">
              {c.items.map((item) => (
                <li
                  key={item.sku}
                  className="flex items-start justify-between gap-3 pb-2 border-b border-outline-variant/30 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-on-surface truncate">
                      {item.name}
                    </span>
                    <span className="text-xs font-mono text-on-surface-variant">
                      {item.sku}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums shrink-0">
                    × {item.qty}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Attachments */}
      {c.attachments.length > 0 ? (
        <section className="flex flex-col gap-3">
          <header className="flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {t("attachments.eyebrow")}
            </p>
            <h2 className="text-2xl font-black uppercase text-primary tracking-[-0.02em]">
              {t("attachments.heading")}
            </h2>
          </header>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {c.attachments.map((att) => (
              <li
                key={att.id}
                className="flex items-center gap-3 p-4 bg-surface-container-lowest"
                style={{
                  borderRadius: "var(--radius-card)",
                  boxShadow: "var(--shadow-ambient)",
                }}
              >
                <span
                  className="w-10 h-10 flex items-center justify-center bg-primary-fixed text-primary shrink-0"
                  style={{ borderRadius: "var(--radius-btn)" }}
                  aria-hidden
                >
                  {att.kind === "photo" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  )}
                </span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-on-surface truncate">
                    {att.fileName}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {formatBytes(att.sizeBytes)} ·{" "}
                    {formatDate(att.uploadedAt, locale)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Timeline */}
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
            {t("timeline.eyebrow")}
          </p>
          <h2 className="text-2xl font-black uppercase text-primary tracking-[-0.02em]">
            {t("timeline.heading")}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t("timeline.subheading")}
          </p>
        </header>
        <ServiceTimeline
          events={c.events}
          locale={locale}
          labels={{
            status: statusLabels,
            customer: t("timeline.customer"),
            swr: t("timeline.swr"),
          }}
        />
      </section>

      {/* Resolution */}
      {c.resolution ? (
        <section
          className="p-6 bg-primary text-white"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">
            {t("detail.resolution")}
          </p>
          <p className="text-sm leading-relaxed">{c.resolution}</p>
        </section>
      ) : null}

      {/* Next action hint */}
      {c.status === "awaiting_customer" ? (
        <section
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-warning/10 text-warning"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <div>
            <h3 className="text-lg font-black uppercase tracking-[-0.01em]">
              {t("awaitingCustomer.heading")}
            </h3>
            <p className="text-sm mt-1 max-w-2xl leading-relaxed">
              {t("awaitingCustomer.body")}
            </p>
          </div>
          <Link
            href="/contact"
            className="text-xs font-bold uppercase tracking-[0.12em] bg-warning text-white px-4 py-3 text-center hover:brightness-110 transition-all shrink-0"
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            {t("awaitingCustomer.cta")}
          </Link>
        </section>
      ) : null}
    </div>
  );
}
