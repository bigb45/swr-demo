import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getProductsPaginated, searchProducts } from "@/lib/magento";
import ProductGrid from "@/components/ProductGrid";
import Pagination from "@/components/Pagination";

export const revalidate = 60;

const PAGE_SIZE = 20;

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
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

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  const { locale } = await params;
  const { page: pageParam, q } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10));
  const query = q?.trim() ?? "";

  const t = await getTranslations({ locale, namespace: "products" });
  const tErr = await getTranslations({ locale, namespace: "errors" });

  let productList;
  let error: string | null = null;

  try {
    productList = query
      ? await searchProducts(query, currentPage, PAGE_SIZE)
      : await getProductsPaginated(currentPage, PAGE_SIZE);
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  const paginationBase = query
    ? `/products?q=${encodeURIComponent(query)}`
    : "/products";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
            {tErr("productsUnavailable", { url: "localhost:8000" })}
          </p>
          <p className="text-xs text-red-500 mt-1 font-mono">{error}</p>
        </div>
      ) : productList?.total_count === 0 && query ? (
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
      ) : (
        <>
          <ProductGrid products={productList?.items ?? []} />
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
  );
}
