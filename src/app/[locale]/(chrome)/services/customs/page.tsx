import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCmsPage } from "@/lib/cms";
import CmsContent from "@/components/CmsContent";
import { Link } from "@/i18n/navigation";
import { IndustryHero, Cta } from "@/components/marketing";
import SpecTable from "@/components/ui/SpecTable";
import { localeAlternates } from "@/lib/seo";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const ZONE_ROWS = ["basel", "north", "central", "east", "south"] as const;
const FILED_ITEMS = [
  "tariff",
  "origin",
  "vat",
  "exportDecl",
  "duties",
  "deliveryNote",
] as const;
const COMPLIANCE_FILTERS = [
  { key: "certificate", href: "/catalog?type=certificate" },
  { key: "datasheet", href: "/catalog?type=datasheet" },
  { key: "sds", href: "/catalog?type=sds" },
  { key: "performance", href: "/catalog?type=performance" },
] as const;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCmsPage("services-customs", locale);
  const t = await getTranslations({ locale, namespace: "services.customs" });
  return {
    title: page?.meta_title ?? t("title"),
    description: page?.meta_description ?? t("subtitle"),
    ...localeAlternates(locale, "/services/customs"),
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const [page, t, tCommon] = await Promise.all([
    getCmsPage("services-customs", locale),
    getTranslations({ locale, namespace: "services.customs" }),
    getTranslations({ locale, namespace: "services" }),
  ]);

  const zoneColumns = [
    { key: "zone", label: t("zones.columns.zone") },
    { key: "regions", label: t("zones.columns.regions") },
    { key: "transit", label: t("zones.columns.transit") },
    { key: "freight", label: t("zones.columns.freight"), className: "text-right" },
  ];

  const dutyColumns = [
    { key: "type", label: t("duties.columns.type") },
    { key: "rate", label: t("duties.columns.rate"), className: "text-right" },
    { key: "note", label: t("duties.columns.note") },
  ];

  const dutyKeys = ["tools", "machines", "consumables", "ppe", "spareParts"] as const;

  return (
    <>
      <IndustryHero
        eyebrow={t("eyebrow")}
        title={page?.content_heading ?? page?.title ?? t("title")}
        subtitle={page?.meta_description ?? t("subtitle")}
      >
        <Cta href="#filed" label={t("filed.heading")} variant="primary" />
        <Cta href="/contact" label={tCommon("bookConsultation")} variant="ghost" />
      </IndustryHero>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 flex flex-col gap-16">
        {/* Reality strip */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-outline-variant/40 overflow-hidden" style={{ borderRadius: "var(--radius-card)" }}>
          {(["aeo", "delivery", "currency", "team"] as const).map((k) => (
            <div key={k} className="bg-surface-container-lowest p-5 flex flex-col gap-1">
              <span className="text-2xl font-black text-primary tracking-[-0.02em]">
                {t(`facts.${k}.value`)}
              </span>
              <span className="text-xs text-on-surface-variant uppercase tracking-[0.08em]">
                {t(`facts.${k}.label`)}
              </span>
            </div>
          ))}
        </section>

        {/* Shipping zones */}
        <section className="flex flex-col gap-6">
          <header className="flex flex-col gap-2 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {t("zones.eyebrow")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-primary tracking-[-0.02em]">
              {t("zones.heading")}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t("zones.subheading")}
            </p>
          </header>
          <SpecTable
            columns={zoneColumns}
            rows={ZONE_ROWS.map((z) => ({
              zone: <span className="font-semibold text-on-surface">{t(`zones.rows.${z}.zone`)}</span>,
              regions: t(`zones.rows.${z}.regions`),
              transit: t(`zones.rows.${z}.transit`),
              freight: <span className="font-mono text-sm">{t(`zones.rows.${z}.freight`)}</span>,
            }))}
          />
          <p className="text-xs text-on-surface-variant">{t("zones.disclaimer")}</p>
        </section>

        {/* Duty rates */}
        <section className="flex flex-col gap-6">
          <header className="flex flex-col gap-2 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {t("duties.eyebrow")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-primary tracking-[-0.02em]">
              {t("duties.heading")}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t("duties.subheading")}
            </p>
          </header>
          <SpecTable
            columns={dutyColumns}
            rows={dutyKeys.map((k) => ({
              type: <span className="font-semibold text-on-surface">{t(`duties.rows.${k}.type`)}</span>,
              rate: <span className="font-mono text-sm">{t(`duties.rows.${k}.rate`)}</span>,
              note: t(`duties.rows.${k}.note`),
            }))}
          />
          <p className="text-xs text-on-surface-variant">{t("duties.disclaimer")}</p>
        </section>

        {/* What we file for you */}
        <section
          id="filed"
          className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 items-start"
        >
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {t("filed.eyebrow")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-primary tracking-[-0.02em]">
              {t("filed.heading")}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t("filed.subheading")}
            </p>
            {page ? (
              <div className="mt-4">
                <CmsContent html={page.content} />
              </div>
            ) : (
              <div className="swr-prose mt-2">
                <p>{t("body1")}</p>
                <p>{t("body2")}</p>
                <p>{t("body3")}</p>
              </div>
            )}
          </div>

          <ul
            className="flex flex-col bg-surface-container-lowest p-5 sm:p-6 gap-1 divide-y divide-outline-variant/30"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            {FILED_ITEMS.map((k) => (
              <li key={k} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  aria-hidden="true"
                  className="shrink-0 mt-0.5 inline-flex items-center justify-center w-6 h-6 bg-secondary text-white text-xs font-black"
                  style={{ borderRadius: "var(--radius-btn)" }}
                >
                  ✓
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold text-on-surface">
                    {t(`filed.items.${k}.title`)}
                  </span>
                  <span className="text-xs text-on-surface-variant leading-relaxed">
                    {t(`filed.items.${k}.body`)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Compliance documents linking to /catalog */}
        <section className="flex flex-col gap-6">
          <header className="flex flex-col gap-2 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {t("compliance.eyebrow")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-primary tracking-[-0.02em]">
              {t("compliance.heading")}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t("compliance.subheading")}
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {COMPLIANCE_FILTERS.map((filter) => (
              <Link
                key={filter.key}
                href={filter.href}
                className="group flex flex-col gap-2 p-5 bg-surface-container-lowest hover:bg-primary-fixed transition-colors"
                style={{ borderRadius: "var(--radius-card)" }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-secondary">
                  {t(`compliance.docs.${filter.key}.eyebrow`)}
                </span>
                <span className="text-sm font-semibold text-on-surface">
                  {t(`compliance.docs.${filter.key}.title`)}
                </span>
                <span className="text-xs text-on-surface-variant leading-relaxed">
                  {t(`compliance.docs.${filter.key}.body`)}
                </span>
                <span className="mt-auto text-xs font-bold uppercase tracking-[0.12em] text-primary group-hover:translate-x-0.5 transition-transform">
                  {t("compliance.openCatalog")} →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Cross-link to delivery */}
        <section
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 bg-surface-container-low"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <div className="flex flex-col gap-1 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-secondary">
              {t("crossLink.eyebrow")}
            </span>
            <h3 className="text-lg font-black uppercase text-primary tracking-[-0.01em]">
              {t("crossLink.heading")}
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t("crossLink.body")}
            </p>
          </div>
          <Cta href="/services/delivery" label={t("crossLink.cta")} variant="ghost" />
        </section>

        {/* Closing CTA */}
        <section
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-8 bg-primary text-white"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <div>
            <h3 className="text-xl font-black uppercase tracking-[-0.01em]">
              {t("ctaHeading")}
            </h3>
            <p className="text-sm text-white/80 mt-2 max-w-xl">{t("ctaBody")}</p>
          </div>
          <Cta href="/contact" label={tCommon("bookConsultation")} variant="primary" />
        </section>
      </div>
    </>
  );
}
