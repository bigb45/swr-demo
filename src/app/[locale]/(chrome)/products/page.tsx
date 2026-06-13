import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  getFilteredProductResults,
  getTopLevelCategories,
  parseProductFacetParams,
} from "@/lib/magento";
import ProductGrid from "@/components/ProductGrid";
import ProductSearchResultList from "@/components/ProductSearchResultList";
import Pagination from "@/components/Pagination";
import ProductsFilterBar from "@/components/products/ProductsFilterBar";
import ProductsActiveFilters from "@/components/products/ProductsActiveFilters";
import GuestPricingBanner from "@/components/products/GuestPricingBanner";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ShopCategoryGrid from "@/components/shop/ShopCategoryGrid";
import ShopCategorySidebar from "@/components/shop/ShopCategorySidebar";
import { toShopCategoryNavItems } from "@/lib/shop-categories";

export const revalidate = 60;

const PAGE_SIZE = 20;

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({
  params,
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const t = await getTranslations({ locale, namespace: "products" });
  return { title: q ? t("searchTitle", { query: q }) : t("title") };
}

function toNumber(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const {
    page: pageParam,
    q,
    category,
    priceMin,
    priceMax,
  } = resolvedSearchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10));
  const query = q?.trim() ?? "";
  const facetParams = parseProductFacetParams(resolvedSearchParams);
  const hasCatalogScope =
    Boolean(query) ||
    Boolean(category) ||
    Boolean(priceMin) ||
    Boolean(priceMax) ||
    Object.values(facetParams).some((values) => values.length > 0);

  const [t, tErr, tBc, tFilter, tShop] = await Promise.all([
    getTranslations({ locale, namespace: "products" }),
    getTranslations({ locale, namespace: "errors" }),
    getTranslations({ locale, namespace: "breadcrumb" }),
    getTranslations({ locale, namespace: "products.filter" }),
    getTranslations({ locale, namespace: "shop" }),
  ]);
  const magentoBaseUrl = process.env.MAGENTO_URL ?? "http://localhost:8000";

  const filters = {
    q: query || undefined,
    categoryId: category || undefined,
    priceMin: toNumber(priceMin),
    priceMax: toNumber(priceMax),
    facets: facetParams,
  };

  let productList;
  let categories: Awaited<ReturnType<typeof getTopLevelCategories>> = [];
  let error: string | null = null;

  if (!hasCatalogScope) {
    categories = await getTopLevelCategories().catch(() => []);
    const categoryItems = toShopCategoryNavItems(categories, 8);

    return (
      <div className="swr-page-shell py-10">
        <Breadcrumbs
          className="mb-8"
          ariaLabel={tBc("ariaLabel")}
          items={[
            { label: tBc("home"), href: "/" },
            { label: t("title") },
          ]}
        />
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-2">
            {t("browseByCategoryEyebrow")}
          </p>
          <h1 className="text-3xl sm:text-5xl font-black uppercase text-primary tracking-[-0.03em] leading-tight">
            {t("browseByCategoryTitle")}
          </h1>
          <p className="mt-4 text-sm sm:text-base text-on-surface-variant leading-relaxed">
            {t("browseByCategoryBody")}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <ShopCategorySidebar
            heading={tShop("sidebarHeading")}
            categories={categoryItems}
          />
          <ShopCategoryGrid
            categories={categoryItems}
            emptyLabel={tShop("empty")}
          />
        </div>
      </div>
    );
  }

  try {
    [productList, categories] = await Promise.all([
      getFilteredProductResults(currentPage, PAGE_SIZE, filters),
      getTopLevelCategories(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  const paginationParams = new URLSearchParams();
  if (query) paginationParams.set("q", query);
  if (category) paginationParams.set("category", category);
  if (priceMin) paginationParams.set("priceMin", priceMin);
  if (priceMax) paginationParams.set("priceMax", priceMax);
  for (const [code, values] of Object.entries(facetParams)) {
    if (values.length > 0) paginationParams.set(code, values.join(","));
  }
  const paginationBase = paginationParams.toString()
    ? `/products?${paginationParams.toString()}`
    : "/products";

  const aggregations = productList?.aggregations ?? [];

  return (
    <div className="swr-page-shell py-10">
      <Breadcrumbs
        className="mb-6"
        ariaLabel={tBc("ariaLabel")}
        items={[
          { label: tBc("home"), href: "/" },
          { label: tBc("products") },
        ]}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {query ? t("searchTitle", { query }) : t("title")}
        </h1>
        {productList && (
          <p className="text-sm text-gray-500 mt-1">
            {query
              ? t("searchTotal", {
                  count: productList.total_count.toLocaleString(locale),
                })
              : t("total", {
                  count: productList.total_count.toLocaleString(locale),
                })}
          </p>
        )}
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-sm text-red-700 font-medium">
            {tErr("productsUnavailable", { url: magentoBaseUrl })}
          </p>
          <p className="text-xs text-red-500 mt-1 font-mono">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          <ProductsFilterBar
            categories={categories}
            aggregations={aggregations}
            active={{
              category: category || undefined,
              priceMin: priceMin || undefined,
              priceMax: priceMax || undefined,
              facets: facetParams,
            }}
          />

          <div>
            {productList ? (
              <ProductsActiveFilters
                active={{
                  q: query || undefined,
                  category: category || undefined,
                  priceMin: priceMin || undefined,
                  priceMax: priceMax || undefined,
                  facets: facetParams,
                }}
                categories={categories}
                aggregations={aggregations}
                labels={{
                  activeFilters: tFilter("activeFilters"),
                  resultsShowing: tFilter("resultsShowing", {
                    count: productList.total_count,
                  }),
                  clearAll: tFilter("clearAll"),
                  removeFilter: tFilter("removeFilter"),
                  allCategories: tFilter("allCategories"),
                  price: tFilter("price"),
                }}
              />
            ) : null}

            {productList?.total_count === 0 && query ? (
              <div className="py-20 flex flex-col items-center gap-5 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant/40">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-bold text-primary mb-1">
                    {t("searchEmpty", { query })}
                  </p>
                  <p className="text-sm text-on-surface-variant max-w-[320px]">
                    {t("searchEmptyHint")}
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary border border-primary/30 px-5 py-2.5 rounded-(--radius-btn) hover:bg-primary/5 transition-colors"
                >
                  <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                  {t("searchEmptyClear")}
                </Link>
              </div>
            ) : productList?.total_count === 0 ? (
              <p className="text-sm text-on-surface-variant py-12 text-center">
                {t("noFilterResults")}
              </p>
            ) : (
              <>
                <GuestPricingBanner />
                {query ? (
                  <ProductSearchResultList
                    products={productList?.items ?? []}
                  />
                ) : (
                  <ProductGrid products={productList?.items ?? []} />
                )}
                {productList && (
                  <Pagination
                    currentPage={currentPage}
                    totalCount={productList.total_count}
                    pageSize={PAGE_SIZE}
                    baseUrl={paginationBase}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
