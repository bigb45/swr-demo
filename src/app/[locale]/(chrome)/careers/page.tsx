import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCmsPage } from "@/lib/cms";
import CmsContent from "@/components/CmsContent";
import { Hero, Cta } from "@/components/marketing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCmsPage("careers", locale);
  const t = await getTranslations({ locale, namespace: "careers" });
  return {
    title: page?.meta_title ?? t("heading"),
    description: page?.meta_description ?? t("subheading"),
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const [page, t] = await Promise.all([
    getCmsPage("careers", locale),
    getTranslations({ locale, namespace: "careers" }),
  ]);

  return (
    <>
      <Hero
        eyebrow={t("eyebrow")}
        title={page?.content_heading ?? page?.title ?? t("heading")}
        subtitle={page?.meta_description ?? t("subheading")}
      >
        <Cta
          href={`mailto:${t("applicationEmail")}`}
          label={t("applyCta")}
          variant="primary"
        />
      </Hero>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          {page ? (
            <CmsContent html={page.content} />
          ) : (
            <div className="swr-prose">
              <p>{t("intro")}</p>
              <h2>{t("whyUsHeading")}</h2>
              <p>{t("whyUsBody")}</p>
              <h2>{t("apprenticeshipHeading")}</h2>
              <p>{t("apprenticeshipBody")}</p>
              <h2>{t("openRolesHeading")}</h2>
              <p>{t("openRolesBody")}</p>
            </div>
          )}
        </div>

        <aside
          className="flex flex-col gap-4 p-6 bg-surface-container-lowest"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary">
            {t("applicationHeading")}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t("applicationBody")}
          </p>
          <a
            href={`mailto:${t("applicationEmail")}`}
            className="text-sm font-semibold text-primary underline hover:no-underline"
          >
            {t("applicationEmail")}
          </a>
          <p className="text-xs text-on-surface-variant/80 mt-2">
            {t("applicationHint")}
          </p>
        </aside>
      </div>
    </>
  );
}
