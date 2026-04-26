import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCmsPage } from "@/lib/cms";
import { getProducts } from "@/lib/magento";
import type { MagentoProduct } from "@/types/magento";
import CmsContent from "@/components/CmsContent";
import { Hero, FeaturedProductsRail, Cta } from "@/components/marketing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCmsPage("offers", locale);
  const t = await getTranslations({ locale, namespace: "offers" });
  return {
    title: page?.meta_title ?? t("heading"),
    description: page?.meta_description ?? t("subheading"),
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const [page, t, tNav] = await Promise.all([
    getCmsPage("offers", locale),
    getTranslations({ locale, namespace: "offers" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  let products: MagentoProduct[] = [];
  try {
    const list = await getProducts(6);
    products = list.items;
  } catch {
    products = [];
  }

  return (
    <>
      <Hero
        eyebrow={t("eyebrow")}
        title={page?.content_heading ?? page?.title ?? t("heading")}
        subtitle={page?.meta_description ?? t("subheading")}
      >
        <Cta href="/products" label={t("shopAll")} variant="primary" />
        <Cta href="/contact" label={tNav("bookConsultation")} variant="white" />
      </Hero>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 flex flex-col gap-12">
        {page ? (
          <CmsContent html={page.content} />
        ) : (
          <div className="swr-prose max-w-[800px]">
            <p>{t("intro")}</p>
            <h2>{t("howHeading")}</h2>
            <p>{t("howBody")}</p>
          </div>
        )}

        <FeaturedProductsRail
          heading={t("featuredHeading")}
          products={products}
          viewAllHref="/products"
          viewAllLabel={t("shopAll")}
          emptyLabel={t("emptyState")}
        />
      </div>
    </>
  );
}
