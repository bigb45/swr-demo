import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProductsByCategory, getCategoryTree } from "@/lib/magento";
import type { MagentoCategory } from "@/types/magento";
import ProductGrid from "@/components/ProductGrid";
import Pagination from "@/components/Pagination";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ page?: string }>;
}

function findCategory(
  tree: MagentoCategory,
  id: number
): MagentoCategory | null {
  if (tree.id === id) return tree;
  for (const child of tree.children_data ?? []) {
    const found = findCategory(child, id);
    if (found) return found;
  }
  return null;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const tree = await getCategoryTree();
    const category = findCategory(tree, parseInt(id, 10));
    if (!category) return { title: "Category not found" };
    return {
      title: category.name,
      description: `Browse ${category.name} — professional tools and hardware.`,
    };
  } catch {
    return { title: "Category" };
  }
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

  const [treeResult, productsResult] = await Promise.allSettled([
    getCategoryTree(),
    getProductsByCategory(categoryId, currentPage, PAGE_SIZE),
  ]);

  const category =
    treeResult.status === "fulfilled"
      ? findCategory(treeResult.value, categoryId)
      : null;

  if (!category) notFound();

  const productList =
    productsResult.status === "fulfilled" ? productsResult.value : null;
  const productsError =
    productsResult.status === "rejected"
      ? productsResult.reason instanceof Error
        ? productsResult.reason.message
        : "Unknown error"
      : null;

  const subcategories =
    category.children_data?.filter((c) => c.is_active) ?? [];

  return (
    <div className="swr-page-shell py-10">
      <Breadcrumbs
        className="mb-8"
        ariaLabel={tBc("ariaLabel")}
        items={[
          { label: tBc("home"), href: "/" },
          { label: tBc("products"), href: "/products" },
          { label: category.name },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        {productList && (
          <p className="text-sm text-gray-500 mt-1">
            {productList.total_count.toLocaleString(locale)} {t("products")}
          </p>
        )}
      </div>

      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {subcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/categories/${sub.id}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-700 rounded-full transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {productsError ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-sm text-red-700 font-medium">
            {tErr("categoryUnavailable")}
          </p>
          <p className="text-xs text-red-500 mt-1 font-mono">{productsError}</p>
        </div>
      ) : (
        <>
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
