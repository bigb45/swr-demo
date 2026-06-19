import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getTopLevelCategories } from "@/lib/magento";
import { LOCALE_STORE_CODES } from "@/lib/magento-shared";
import { toShopCategoryNavItems } from "@/lib/shop-categories";
import ShopCategoryGrid from "@/components/shop/ShopCategoryGrid";
import ShopCategorySidebar from "@/components/shop/ShopCategorySidebar";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PageHeaderLight from "@/components/ui/PageHeaderLight";

export const revalidate = 300;

interface ShopPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ShopPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { locale } = await params;
  const [t, tBc, categories] = await Promise.all([
    getTranslations({ locale, namespace: "shop" }),
    getTranslations({ locale, namespace: "breadcrumb" }),
    getTopLevelCategories(LOCALE_STORE_CODES[locale]).catch(() => []),
  ]);
  const categoryItems = toShopCategoryNavItems(categories, 8);

  return (
    <div className="swr-page-shell pt-10 pb-8">
      <Breadcrumbs
        className="mb-8"
        ariaLabel={tBc("ariaLabel")}
        items={[
          { label: tBc("home"), href: "/" },
          { label: t("heading") },
        ]}
      />

      <PageHeaderLight
        eyebrow={t("eyebrow")}
        title={t("heading")}
        subtitle={t("subheading")}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <ShopCategorySidebar
          heading={t("sidebarHeading")}
          categories={categoryItems}
        />
        <ShopCategoryGrid
          categories={categoryItems}
          emptyLabel={t("empty")}
        />
      </div>
    </div>
  );
}
