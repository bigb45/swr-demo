import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCmsPage } from "@/lib/cms";
import CmsContent from "@/components/CmsContent";
import { Link } from "@/i18n/navigation";
import {
  IndustryHero,
  Cta,
  FeaturedProductsRail,
  CatalogPreviewRail,
} from "@/components/marketing";
import SpecTable from "@/components/ui/SpecTable";
import { INDUSTRY_CONFIG } from "@/lib/industries";
import {
  findCategoryByName,
  getCategoryTree,
  getProductsByCategory,
} from "@/lib/magento";
import type { MagentoProduct } from "@/types/magento";
import { listDocuments } from "@/lib/catalog";
import { localeAlternates } from "@/lib/seo";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const SUB_CATEGORIES = ["mig", "tig", "mma", "plasma", "spot", "consumables"] as const;
const GAS_ROWS = ["argon", "argonCo2", "co2", "argonH2", "argonHe", "oxygen"] as const;
const GUIDES = ["gasSelection", "wirePrep", "ppe", "currentSettings"] as const;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCmsPage("industry-welding", locale);
  const t = await getTranslations({ locale, namespace: "industries.weldingHub" });
  return {
    title: page?.meta_title ?? t("title"),
    description: page?.meta_description ?? t("subtitle"),
    ...localeAlternates(locale, "/industries/welding"),
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const config = INDUSTRY_CONFIG.welding;

  const [page, t, tIndustries, tServices] = await Promise.all([
    getCmsPage(config.cmsIdentifier, locale),
    getTranslations({ locale, namespace: "industries.weldingHub" }),
    getTranslations({ locale, namespace: "industries" }),
    getTranslations({ locale, namespace: "services" }),
  ]);

  let categoryId: number | null = null;
  let products: MagentoProduct[] = [];
  try {
    const tree = await getCategoryTree();
    const cat = findCategoryByName(tree, config.categoryNames);
    if (cat) {
      categoryId = cat.id;
      const list = await getProductsByCategory(cat.id, 1, 6);
      products = list.items;
    }
  } catch {
    categoryId = null;
    products = [];
  }

  let weldingDocs: Awaited<ReturnType<typeof listDocuments>>["items"] = [];
  try {
    const result = await listDocuments({ categories: ["welding"], limit: 6 });
    weldingDocs = result.items;
  } catch {
    weldingDocs = [];
  }

  const gasColumns = [
    { key: "mix", label: t("gasTable.columns.mix") },
    { key: "use", label: t("gasTable.columns.use") },
    { key: "current", label: t("gasTable.columns.current"), className: "text-right" },
    { key: "notes", label: t("gasTable.columns.notes") },
  ];

  return (
    <>
      <IndustryHero
        eyebrow={t("eyebrow")}
        title={page?.content_heading ?? page?.title ?? t("title")}
        subtitle={page?.meta_description ?? t("subtitle")}
      >
        <Cta
          href={categoryId ? `/categories/${categoryId}` : "/products"}
          label={tIndustries("browseCatalog")}
          variant="primary"
        />
        <Cta href="/services/repair" label={tServices("repair.title")} variant="ghost" />
      </IndustryHero>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 flex flex-col gap-16">
        {/* Sub-category tiles */}
        <section className="flex flex-col gap-6">
          <header className="flex flex-col gap-2 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {t("subCategories.eyebrow")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-primary tracking-[-0.02em]">
              {t("subCategories.heading")}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t("subCategories.subheading")}
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUB_CATEGORIES.map((sc) => (
              <Link
                key={sc}
                href={categoryId ? `/categories/${categoryId}?type=${sc}` : "/products"}
                className="group flex flex-col gap-2 p-5 bg-surface-container-lowest hover:bg-primary-fixed transition-colors"
                style={{ borderRadius: "var(--radius-card)" }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-secondary">
                  {t(`subCategories.items.${sc}.eyebrow`)}
                </span>
                <span className="text-base font-black text-primary uppercase tracking-[-0.01em]">
                  {t(`subCategories.items.${sc}.title`)}
                </span>
                <span className="text-xs text-on-surface-variant leading-relaxed">
                  {t(`subCategories.items.${sc}.body`)}
                </span>
                <span className="mt-auto text-xs font-bold uppercase tracking-[0.12em] text-primary group-hover:translate-x-0.5 transition-transform">
                  {t("subCategories.cta")} →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured welding products */}
        <FeaturedProductsRail
          heading={t("products.heading")}
          subheading={t("products.subheading")}
          products={products}
          viewAllHref={categoryId ? `/categories/${categoryId}` : undefined}
          viewAllLabel={categoryId ? tIndustries("viewAll") : undefined}
          emptyLabel={tIndustries("rangeComingSoon")}
        />

        {/* Gas safety + selection table */}
        <section className="flex flex-col gap-6">
          <header className="flex flex-col gap-2 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {t("gasTable.eyebrow")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-primary tracking-[-0.02em]">
              {t("gasTable.heading")}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t("gasTable.subheading")}
            </p>
          </header>
          <SpecTable
            columns={gasColumns}
            rows={GAS_ROWS.map((g) => ({
              mix: <span className="font-mono text-sm font-semibold text-on-surface">{t(`gasTable.rows.${g}.mix`)}</span>,
              use: t(`gasTable.rows.${g}.use`),
              current: <span className="font-mono text-sm">{t(`gasTable.rows.${g}.current`)}</span>,
              notes: t(`gasTable.rows.${g}.notes`),
            }))}
          />
          <div
            className="flex items-start gap-3 p-4 bg-surface-container-low"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            <span
              aria-hidden="true"
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 bg-secondary text-white text-sm font-black"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              !
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-on-surface">
                {t("gasTable.safetyHeading")}
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t("gasTable.safetyBody")}
              </p>
            </div>
          </div>
        </section>

        {/* Technical guides linking into catalog */}
        <section className="flex flex-col gap-6">
          <header className="flex flex-col gap-2 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {t("guides.eyebrow")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-primary tracking-[-0.02em]">
              {t("guides.heading")}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t("guides.subheading")}
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {GUIDES.map((g) => (
              <Link
                key={g}
                href={`/catalog?category=welding&type=${t(`guides.items.${g}.docType`)}`}
                className="group flex flex-col gap-2 p-5 bg-surface-container-lowest hover:bg-primary-fixed transition-colors"
                style={{ borderRadius: "var(--radius-card)" }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-secondary">
                  {t(`guides.items.${g}.eyebrow`)}
                </span>
                <span className="text-sm font-semibold text-on-surface">
                  {t(`guides.items.${g}.title`)}
                </span>
                <span className="text-xs text-on-surface-variant leading-relaxed">
                  {t(`guides.items.${g}.body`)}
                </span>
                <span className="mt-auto text-xs font-bold uppercase tracking-[0.12em] text-primary group-hover:translate-x-0.5 transition-transform">
                  {t("guides.openCatalog")} →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Welding catalog rail (real PDFs from data) */}
        {weldingDocs.length > 0 ? (
          <CatalogPreviewRail
            heading={t("catalogRail.heading")}
            subheading={t("catalogRail.subheading")}
            documents={weldingDocs}
            viewAllLabel={t("catalogRail.viewAll")}
            viewAllHref="/catalog?category=welding"
          />
        ) : null}

        {/* Certified installer / service block */}
        <section
          className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 p-6 sm:p-8 bg-primary text-white"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/70">
              {t("installer.eyebrow")}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-[-0.02em]">
              {t("installer.heading")}
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">
              {t("installer.body")}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Cta href="/services/repair" label={t("installer.ctaRepair")} variant="primary" />
              <Cta href="/contact" label={t("installer.ctaConsult")} variant="ghost" />
            </div>
          </div>
          <ul className="flex flex-col gap-1 divide-y divide-white/10">
            {(["calibration", "loaner", "onsite", "training"] as const).map((k) => (
              <li key={k} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span aria-hidden="true" className="text-white/60 font-mono text-sm shrink-0 w-6">
                  ✓
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">
                    {t(`installer.items.${k}.title`)}
                  </span>
                  <span className="text-xs text-white/70 leading-relaxed">
                    {t(`installer.items.${k}.body`)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* CMS narrative / fallback prose */}
        {page ? (
          <section>
            <CmsContent html={page.content} />
          </section>
        ) : (
          <section className="swr-prose max-w-[800px]">
            <p>{t("body1")}</p>
            <p>{t("body2")}</p>
          </section>
        )}
      </div>
    </>
  );
}
