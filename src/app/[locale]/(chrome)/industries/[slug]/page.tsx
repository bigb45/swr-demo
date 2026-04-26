import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCmsPage } from "@/lib/cms";
import CmsContent from "@/components/CmsContent";
import {
  IndustryHero,
  Cta,
  FeaturedProductsRail,
} from "@/components/marketing";
import {
  INDUSTRY_CONFIG,
  INDUSTRY_SLUGS,
  isIndustrySlug,
} from "@/lib/industries";
import {
  findCategoryByName,
  getCategoryTree,
  getProductsByCategory,
} from "@/lib/magento";
import type { MagentoProduct } from "@/types/magento";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return INDUSTRY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isIndustrySlug(slug)) return {};
  const config = INDUSTRY_CONFIG[slug];
  const page = await getCmsPage(config.cmsIdentifier, locale);
  const t = await getTranslations({ locale, namespace: "industries" });
  return {
    title: page?.meta_title ?? t(`slugs.${slug}.title`),
    description: page?.meta_description ?? t(`slugs.${slug}.subtitle`),
  };
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isIndustrySlug(slug)) notFound();
  const config = INDUSTRY_CONFIG[slug];

  const [page, t, tCommon] = await Promise.all([
    getCmsPage(config.cmsIdentifier, locale),
    getTranslations({ locale, namespace: "industries" }),
    getTranslations({ locale, namespace: "services" }),
  ]);

  // Resolve the Magento category for this industry and fetch a few featured
  // products. Any of these calls may fail (Magento offline, category missing)
  // — we degrade gracefully and just hide the rail in that case.
  let categoryId: number | null = null;
  let products: MagentoProduct[] = [];
  try {
    const tree = await getCategoryTree();
    const cat = findCategoryByName(tree, config.categoryNames);
    if (cat) {
      categoryId = cat.id;
      const list = await getProductsByCategory(cat.id, 1, 4);
      products = list.items;
    }
  } catch {
    categoryId = null;
    products = [];
  }

  return (
    <>
      <IndustryHero
        eyebrow={t(`slugs.${slug}.eyebrow`)}
        title={page?.content_heading ?? page?.title ?? t(`slugs.${slug}.title`)}
        subtitle={page?.meta_description ?? t(`slugs.${slug}.subtitle`)}
      >
        <Cta
          href={categoryId ? `/categories/${categoryId}` : "/products"}
          label={t("browseCatalog")}
          variant="primary"
        />
        <Cta href="/contact" label={tCommon("bookConsultation")} variant="ghost" />
      </IndustryHero>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 flex flex-col gap-12">
        {page ? (
          <CmsContent html={page.content} />
        ) : (
          <div className="swr-prose max-w-[800px]">
            <p>{t(`slugs.${slug}.body1`)}</p>
            <p>{t(`slugs.${slug}.body2`)}</p>
          </div>
        )}

        <FeaturedProductsRail
          heading={t("featuredHeading")}
          products={products}
          viewAllHref={categoryId ? `/categories/${categoryId}` : undefined}
          viewAllLabel={categoryId ? t("viewAll") : undefined}
          emptyLabel={t("rangeComingSoon")}
        />
      </div>
    </>
  );
}
