import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  getFilteredProducts,
  getTopLevelCategories,
} from "@/lib/magento";
import ProductGrid from "@/components/ProductGrid";
import ProductSearchResultList from "@/components/ProductSearchResultList";
import Pagination from "@/components/Pagination";
import ProductsFilterBar from "@/components/products/ProductsFilterBar";

export const revalidate = 60;

const PAGE_SIZE = 20;

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    category?: string;
    priceMin?: string;
    priceMax?: string;
  }>;
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
  const { page: pageParam, q, category, priceMin, priceMax } =
    await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10));
  const query = q?.trim() ?? "";

  const t = await getTranslations({ locale, namespace: "products" });
  const tErr = await getTranslations({ locale, namespace: "errors" });
  const magentoBaseUrl = process.env.MAGENTO_URL ?? "http://localhost:8000";

  const filters = {
    q: query || undefined,
    categoryId: category || undefined,
    priceMin: toNumber(priceMin),
    priceMax: toNumber(priceMax),
  };

  let productList;
  let categories: Awaited<ReturnType<typeof getTopLevelCategories>> = [];
  let error: string | null = null;

  try {
    [productList, categories] = await Promise.all([
      getFilteredProducts(currentPage, PAGE_SIZE, filters),
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
  const paginationBase = paginationParams.toString()
    ? `/products?${paginationParams.toString()}`
    : "/products";

  return (
    <div className="swr-page-shell py-10">
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
            active={{
              category: category || undefined,
              priceMin: priceMin || undefined,
              priceMax: priceMax || undefined,
            }}
          />

          <div>
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
                <a
                  href={`/${locale}/products`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary border border-primary/30 px-5 py-2.5 rounded-(--radius-btn) hover:bg-primary/5 transition-colors"
                >
                  ← {t("searchEmptyClear")}
                </a>
              </div>
            ) : productList?.total_count === 0 ? (
              <p className="text-sm text-on-surface-variant py-12 text-center">
                {t("noFilterResults")}
              </p>
            ) : (
              <>
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
