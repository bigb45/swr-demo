import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCmsPage } from "@/lib/cms";
import CmsContent from "@/components/CmsContent";
import { Hero, Cta, FeatureGrid } from "@/components/marketing";
import type { FeatureItem } from "@/components/marketing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCmsPage("about", locale);
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: page?.meta_title ?? t("heading"),
    description: page?.meta_description ?? t("subheading"),
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const [page, t] = await Promise.all([
    getCmsPage("about", locale),
    getTranslations({ locale, namespace: "about" }),
  ]);

  const values: FeatureItem[] = (
    ["quality", "service360", "partnership"] as const
  ).map((key) => ({
    title: t(`values.${key}Title`),
    description: t(`values.${key}Body`),
  }));

  return (
    <>
      <Hero
        eyebrow={t("eyebrow")}
        title={page?.content_heading ?? page?.title ?? t("heading")}
        subtitle={page?.meta_description ?? t("subheading")}
      >
        <Cta href="/contact" label={t("bookConsultation")} variant="primary" />
        <Cta href="/services" label={t("explore360")} variant="white" />
      </Hero>

      <div className="swr-page-shell py-12 sm:py-16 flex flex-col gap-12">
        {page ? (
          <CmsContent html={page.content} />
        ) : (
          <div className="swr-prose">
            <p>{t("fallbackIntro")}</p>
            <h2>{t("missionHeading")}</h2>
            <p>{t("missionBody")}</p>
            <h2>{t("approachHeading")}</h2>
            <p>{t("approachBody")}</p>
          </div>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-black uppercase tracking-[-0.02em] text-primary">
            {t("valuesHeading")}
          </h2>
          <FeatureGrid items={values} columns={3} />
        </section>

        <section
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-8 bg-primary text-white"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <div>
            <h3 className="text-xl font-black uppercase tracking-[-0.01em]">
              {t("ctaHeading")}
            </h3>
            <p className="text-sm text-white/80 mt-2 max-w-xl">
              {t("ctaBody")}
            </p>
          </div>
          <Cta href="/contact" label={t("bookConsultation")} variant="primary" />
        </section>
      </div>
    </>
  );
}
