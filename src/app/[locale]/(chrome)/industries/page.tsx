import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCmsPage } from "@/lib/cms";
import CmsContent from "@/components/CmsContent";
import { Hero, ServiceCard } from "@/components/marketing";
import { INDUSTRY_SLUGS } from "@/lib/industries";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCmsPage("industries-hub", locale);
  const t = await getTranslations({ locale, namespace: "industries.hub" });
  return {
    title: page?.meta_title ?? t("heading"),
    description: page?.meta_description ?? t("subheading"),
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const [page, t, tShared] = await Promise.all([
    getCmsPage("industries-hub", locale),
    getTranslations({ locale, namespace: "industries.hub" }),
    getTranslations({ locale, namespace: "industries" }),
  ]);

  return (
    <>
      <Hero
        eyebrow={t("eyebrow")}
        title={page?.content_heading ?? page?.title ?? t("heading")}
        subtitle={page?.meta_description ?? t("subheading")}
      />

      <div className="swr-page-shell py-12 sm:py-16 flex flex-col gap-12">
        {page ? <CmsContent html={page.content} /> : null}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDUSTRY_SLUGS.map((slug) => (
            <ServiceCard
              key={slug}
              eyebrow={tShared(`slugs.${slug}.eyebrow`)}
              title={tShared(`slugs.${slug}.title`)}
              description={tShared(`slugs.${slug}.shortBody`)}
              href={`/industries/${slug}`}
              ctaLabel={t("exploreIndustry")}
            />
          ))}
        </section>
      </div>
    </>
  );
}
