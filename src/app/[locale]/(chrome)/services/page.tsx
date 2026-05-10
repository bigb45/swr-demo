import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCmsPage } from "@/lib/cms";
import CmsContent from "@/components/CmsContent";
import { Hero, ServiceCard, Cta } from "@/components/marketing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCmsPage("services-hub", locale);
  const t = await getTranslations({ locale, namespace: "services.hub" });
  return {
    title: page?.meta_title ?? t("heading"),
    description: page?.meta_description ?? t("subheading"),
  };
}

const ICON_CONSULT = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const ICON_REPAIR = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
const ICON_DELIVERY = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const [page, t, tShared] = await Promise.all([
    getCmsPage("services-hub", locale),
    getTranslations({ locale, namespace: "services.hub" }),
    getTranslations({ locale, namespace: "services" }),
  ]);

  const pillars = [
    {
      icon: ICON_CONSULT,
      href: "/services/consulting",
      eyebrow: tShared("consulting.eyebrow"),
      title: tShared("consulting.title"),
      description: tShared("consulting.shortBody"),
    },
    {
      icon: ICON_REPAIR,
      href: "/services/repair",
      eyebrow: tShared("repair.eyebrow"),
      title: tShared("repair.title"),
      description: tShared("repair.shortBody"),
    },
    {
      icon: ICON_DELIVERY,
      href: "/services/delivery",
      eyebrow: tShared("delivery.eyebrow"),
      title: tShared("delivery.title"),
      description: tShared("delivery.shortBody"),
    },
  ];

  return (
    <>
      <Hero
        eyebrow={t("eyebrow")}
        title={page?.content_heading ?? page?.title ?? t("heading")}
        subtitle={page?.meta_description ?? t("subheading")}
      >
        <Cta href="/contact" label={t("bookConsultation")} variant="primary" />
      </Hero>

      <div className="swr-page-shell py-12 sm:py-16 flex flex-col gap-12">
        {page ? <CmsContent html={page.content} /> : null}

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pillars.map((p) => (
            <ServiceCard
              key={p.href}
              icon={p.icon}
              eyebrow={p.eyebrow}
              title={p.title}
              description={p.description}
              href={p.href}
              ctaLabel={t("learnMore")}
            />
          ))}
        </section>
      </div>
    </>
  );
}
