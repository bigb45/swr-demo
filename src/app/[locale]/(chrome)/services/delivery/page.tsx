import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCmsPage } from "@/lib/cms";
import { ServicePillarPage } from "@/components/marketing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCmsPage("services-delivery", locale);
  const t = await getTranslations({ locale, namespace: "services.delivery" });
  return {
    title: page?.meta_title ?? t("title"),
    description: page?.meta_description ?? t("subtitle"),
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const [page, t, tCommon] = await Promise.all([
    getCmsPage("services-delivery", locale),
    getTranslations({ locale, namespace: "services.delivery" }),
    getTranslations({ locale, namespace: "services" }),
  ]);

  return (
    <ServicePillarPage
      page={page}
      fallback={{
        eyebrow: t("eyebrow"),
        title: t("title"),
        subtitle: t("subtitle"),
        paragraphs: [t("body1"), t("body2"), t("body3")],
      }}
      ctaHref="/contact"
      ctaLabel={tCommon("bookConsultation")}
      ctaHeading={t("ctaHeading")}
      ctaBody={t("ctaBody")}
    />
  );
}
