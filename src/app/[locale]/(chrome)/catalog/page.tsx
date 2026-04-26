import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  listDocuments,
  type CatalogCategory,
  type DocumentType,
  CATALOG_CATEGORIES,
  DOCUMENT_TYPES,
} from "@/lib/catalog";
import Hero from "@/components/marketing/Hero";
import DocumentCard from "@/components/catalog/DocumentCard";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import CatalogSearch from "@/components/catalog/CatalogSearch";
import ActiveFilters from "@/components/catalog/ActiveFilters";
import { localeAlternates } from "@/lib/seo";

export const revalidate = 300;

interface CatalogPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
    brand?: string;
    language?: string;
  }>;
}

function parseList(v: string | undefined): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function asTypes(v: string | undefined): DocumentType[] {
  return parseList(v).filter((s): s is DocumentType =>
    (DOCUMENT_TYPES as string[]).includes(s)
  );
}

function asCategories(v: string | undefined): CatalogCategory[] {
  return parseList(v).filter((s): s is CatalogCategory =>
    (CATALOG_CATEGORIES as string[]).includes(s)
  );
}

export async function generateMetadata({
  params,
}: CatalogPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    ...localeAlternates(locale, "/catalog"),
  };
}

export default async function CatalogPage({
  params,
  searchParams,
}: CatalogPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "catalog" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const filters = {
    q: sp.q?.trim() || undefined,
    types: asTypes(sp.type),
    categories: asCategories(sp.category),
    brands: parseList(sp.brand),
    languages: parseList(sp.language),
  };

  const { items, totalCount, facets } = await listDocuments(filters);

  const typeLabels = Object.fromEntries(
    DOCUMENT_TYPES.map((tt) => [tt, t(`types.${tt}`)])
  );
  const categoryLabels = Object.fromEntries(
    CATALOG_CATEGORIES.map((cc) => [cc, t(`categories.${cc}`)])
  );
  const languageLabels: Record<string, string> = {
    de: t("languages.de"),
    en: t("languages.en"),
    fr: t("languages.fr"),
    it: t("languages.it"),
    es: t("languages.es"),
    nl: t("languages.nl"),
    pl: t("languages.pl"),
    pt: t("languages.pt"),
  };

  return (
    <>
      <Hero
        eyebrow={t("eyebrow")}
        title={t("heading")}
        subtitle={t("subheading")}
        variant="compact"
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10">
        <div className="mb-6">
          <CatalogSearch
            placeholder={t("searchPlaceholder")}
            ariaLabel={tNav("search")}
          />
        </div>

        <ActiveFilters
          active={filters}
          totalCount={totalCount}
          labels={{
            activeFilters: t("filters.activeFilters"),
            resultsShowing: t("filters.resultsShowing", { count: totalCount }),
            clearAll: t("filters.clearAll"),
            typeLabels,
            categoryLabels,
            languageLabels,
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          <FilterSidebar
            facets={facets}
            active={filters}
            labels={{
              title: t("filters.title"),
              subtitle: t("filters.subtitle"),
              sectionCategory: t("filters.category"),
              sectionType: t("filters.type"),
              sectionBrand: t("filters.brand"),
              sectionLanguage: t("filters.language"),
              clearAll: t("filters.clearAll"),
              manufacturerSearch: t("filters.manufacturerSearch"),
              typeLabels,
              categoryLabels,
              languageLabels,
            }}
          />

          <div>
            {items.length === 0 ? (
              <div
                className="p-10 text-center bg-surface-container-lowest"
                style={{ borderRadius: "var(--radius-card)" }}
              >
                <p className="text-sm text-on-surface-variant">
                  {t("emptyState")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    typeLabel={t(`types.${doc.type}`)}
                    pageLabel={
                      doc.pageCount
                        ? t("pageCount", { count: doc.pageCount })
                        : undefined
                    }
                    languageLabel={
                      languageLabels[doc.language] ?? doc.language.toUpperCase()
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
