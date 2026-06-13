import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getTopLevelCategories } from "@/lib/magento";
import { toShopCategoryNavItems } from "@/lib/shop-categories";
import ShopCategoryGrid from "@/components/shop/ShopCategoryGrid";
import ShopCategorySidebar from "@/components/shop/ShopCategorySidebar";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

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
    getTopLevelCategories().catch(() => []),
  ]);
  const categoryItems = toShopCategoryNavItems(categories, 8);

  return (
    <div className="swr-page-shell py-10">
      <Breadcrumbs
        className="mb-8"
        ariaLabel={tBc("ariaLabel")}
        items={[
          { label: tBc("home"), href: "/" },
          { label: t("heading") },
        ]}
      />

      <div className="mb-8 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-2">
          {t("eyebrow")}
        </p>
        <h1 className="text-3xl sm:text-5xl font-black uppercase text-primary tracking-[-0.03em] leading-tight">
          {t("heading")}
        </h1>
        <p className="mt-4 text-sm sm:text-base text-on-surface-variant leading-relaxed">
          {t("subheading")}
        </p>
      </div>

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
