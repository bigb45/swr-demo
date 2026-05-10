import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCmsPage } from "@/lib/cms";
import CmsContent from "@/components/CmsContent";
import { IndustryHero, Cta, ServiceCard } from "@/components/marketing";
import RepairIntakePanel from "@/components/services/RepairIntakePanel";
import RepairTimeline from "@/components/services/RepairTimeline";
import { localeAlternates } from "@/lib/seo";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const REPAIR_CATEGORIES = [
  "welding",
  "powerTools",
  "pneumatic",
  "machines",
  "measuring",
  "safety",
] as const;

const TIMELINE_STEPS = ["dropoff", "diagnosis", "repair", "pickup"] as const;

const ICON_WRENCH = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCmsPage("services-repair", locale);
  const t = await getTranslations({ locale, namespace: "services.repair" });
  return {
    title: page?.meta_title ?? t("title"),
    description: page?.meta_description ?? t("subtitle"),
    ...localeAlternates(locale, "/services/repair"),
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const [page, t, tCommon] = await Promise.all([
    getCmsPage("services-repair", locale),
    getTranslations({ locale, namespace: "services.repair" }),
    getTranslations({ locale, namespace: "services" }),
  ]);

  return (
    <>
      <IndustryHero
        eyebrow={t("eyebrow")}
        title={page?.content_heading ?? page?.title ?? t("title")}
        subtitle={page?.meta_description ?? t("subtitle")}
      >
        <Cta href="#repair-form" label={t("form.submit")} variant="primary" />
        <Cta href="/contact" label={tCommon("bookConsultation")} variant="ghost" />
      </IndustryHero>

      <div className="swr-page-shell py-12 sm:py-16 flex flex-col gap-16">
        {/* Service categories grid */}
        <section className="flex flex-col gap-6">
          <header className="flex flex-col gap-2 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {t("categories.eyebrow")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-primary tracking-[-0.02em]">
              {t("categories.heading")}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t("categories.subheading")}
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPAIR_CATEGORIES.map((c) => (
              <ServiceCard
                key={c}
                icon={ICON_WRENCH}
                eyebrow={t(`categories.items.${c}.eyebrow`)}
                title={t(`categories.items.${c}.title`)}
                description={t(`categories.items.${c}.body`)}
                href="#repair-form"
                ctaLabel={t("categories.requestQuote")}
              />
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="flex flex-col gap-6">
          <header className="flex flex-col gap-2 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {t("timeline.eyebrow")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-primary tracking-[-0.02em]">
              {t("timeline.heading")}
            </h2>
          </header>
          <RepairTimeline
            callout={{
              value: t("timeline.calloutValue"),
              label: t("timeline.calloutLabel"),
            }}
            steps={TIMELINE_STEPS.map((s, idx) => ({
              index: idx + 1,
              title: t(`timeline.steps.${s}.title`),
              body: t(`timeline.steps.${s}.body`),
            }))}
          />
        </section>

        {/* CMS content + form */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 items-start" id="repair-form">
          <div className="flex flex-col gap-4">
            {page ? (
              <CmsContent html={page.content} />
            ) : (
              <div className="swr-prose max-w-[600px]">
                <p>{t("body1")}</p>
                <p>{t("body2")}</p>
                <p>{t("body3")}</p>
              </div>
            )}
          </div>
          <RepairIntakePanel locale={locale} />
        </section>

        {/* Closing CTA */}
        <section
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-8 bg-primary text-white"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <div>
            <h3 className="text-xl font-black uppercase tracking-[-0.01em]">
              {t("ctaHeading")}
            </h3>
            <p className="text-sm text-white/80 mt-2 max-w-xl">{t("ctaBody")}</p>
          </div>
          <Cta href="/contact" label={tCommon("requestService")} variant="primary" />
        </section>
      </div>
    </>
  );
}
