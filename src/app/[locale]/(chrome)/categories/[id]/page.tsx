import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getProductsByCategory,
  getCategoryById,
  getCategoryWithSubcategories,
} from "@/lib/magento";
import { LOCALE_STORE_CODES } from "@/lib/magento-shared";
import ProductGrid from "@/components/ProductGrid";
import GuestPricingBanner from "@/components/products/GuestPricingBanner";
import Pagination from "@/components/Pagination";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageHeaderLight from "@/components/ui/PageHeaderLight";

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) return { title: "Category not found" };

  const category = await getCategoryById(
    categoryId,
    LOCALE_STORE_CODES[locale],
  );
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: `Browse ${category.name}: professional tools and hardware.`,
  };
}

const PAGE_SIZE = 20;

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { locale, id } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10));
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) notFound();

  const t = await getTranslations({ locale, namespace: "categories" });
  const tBc = await getTranslations({ locale, namespace: "breadcrumb" });
  const tErr = await getTranslations({ locale, namespace: "errors" });
  const storeCode = LOCALE_STORE_CODES[locale];

  const [categoryResult, productsResult] = await Promise.allSettled([
    getCategoryWithSubcategories(categoryId, storeCode),
    getProductsByCategory(categoryId, currentPage, PAGE_SIZE),
  ]);

  const categoryData =
    categoryResult.status === "fulfilled" ? categoryResult.value : null;

  if (!categoryData) notFound();

  const { category, subcategories } = categoryData;

  const productList =
    productsResult.status === "fulfilled" ? productsResult.value : null;
  const productsError = productsResult.status === "rejected";
  if (productsError) {
    console.error(
      `[categories/${categoryId}] product fetch failed:`,
      productsResult.reason,
    );
  }

  return (
    <div className="swr-page-shell pt-10 pb-8">
      <Breadcrumbs
        className="mb-8"
        ariaLabel={tBc("ariaLabel")}
        items={[
          { label: tBc("home"), href: "/" },
          { label: tBc("products"), href: "/products" },
          { label: category.name },
        ]}
      />

      <PageHeaderLight
        className="mb-8"
        title={category.name}
        subtitle={
          productList
            ? `${productList.total_count.toLocaleString(locale)} ${t("products")}`
            : undefined
        }
      />

      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {subcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/categories/${sub.id}`}
              className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container-low hover:bg-primary-fixed hover:text-primary rounded-(--radius-btn) transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {productsError ? (
        <div
          className="bg-red-50 p-6 text-center"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <p className="text-sm text-red-700 font-medium">
            {tErr("categoryUnavailable")}
          </p>
        </div>
      ) : (
        <>
          <GuestPricingBanner />
          <ProductGrid
            products={productList?.items ?? []}
            emptyMessage={t("empty")}
          />
          {productList && (
            <Pagination
              currentPage={currentPage}
              totalCount={productList.total_count}
              pageSize={PAGE_SIZE}
              baseUrl={`/categories/${id}`}
            />
          )}
        </>
      )}
    </div>
  );
}
