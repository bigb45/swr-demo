import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCmsPage } from "@/lib/cms";
import CmsContent from "@/components/CmsContent";
import { Hero, BrandLogoStrip, Cta } from "@/components/marketing";
import type { BrandLogo } from "@/components/marketing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCmsPage("partners", locale);
  const t = await getTranslations({ locale, namespace: "partners" });
  return {
    title: page?.meta_title ?? t("heading"),
    description: page?.meta_description ?? t("subheading"),
  };
}

// Curated list of brand partners. Keeping logos text-only (no external
// image URLs) until Magento admin supplies asset paths.
const PARTNER_BRANDS: BrandLogo[] = [
  { name: "Bosch" },
  { name: "Metabo" },
  { name: "Fronius" },
  { name: "Würth" },
  { name: "Makita" },
  { name: "Hilti" },
  { name: "Fein" },
  { name: "3M" },
  { name: "Uvex" },
  { name: "Wiha" },
];

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const [page, t, tNav] = await Promise.all([
    getCmsPage("partners", locale),
    getTranslations({ locale, namespace: "partners" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  return (
    <>
      <Hero
        eyebrow={t("eyebrow")}
        title={page?.content_heading ?? page?.title ?? t("heading")}
        subtitle={page?.meta_description ?? t("subheading")}
      >
        <Cta href="/contact" label={tNav("bookConsultation")} variant="primary" />
      </Hero>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 flex flex-col gap-12">
        <BrandLogoStrip
          heading={t("logoStripHeading")}
          logos={PARTNER_BRANDS}
        />

        {page ? (
          <CmsContent html={page.content} />
        ) : (
          <div className="swr-prose max-w-[800px]">
            <p>{t("intro")}</p>
            <h2>{t("criteriaHeading")}</h2>
            <p>{t("criteriaBody")}</p>
            <h2>{t("coverageHeading")}</h2>
            <p>{t("coverageBody")}</p>
          </div>
        )}
      </div>
    </>
  );
}
