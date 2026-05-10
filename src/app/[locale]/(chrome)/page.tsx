import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getProducts } from "@/lib/magento";
import { listDocuments } from "@/lib/catalog";
import {
  Hero,
  Cta,
  ServiceCard,
  IntentTile,
  RealityStrip,
  PersonCard,
  CatalogPreviewRail,
  WorkshopBlock,
  FeaturedProductsRail,
} from "@/components/marketing";
import type { RealityItem } from "@/components/marketing";
import { INDUSTRY_SLUGS } from "@/lib/industries";

export const revalidate = 60;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const ICON_CONSULTING = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const ICON_REPAIR = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
const ICON_DELIVERY = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const [t, tNav, tServices, tIndustries, tCatalog, tContact] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "services" }),
    getTranslations({ locale, namespace: "industries" }),
    getTranslations({ locale, namespace: "catalog" }),
    getTranslations({ locale, namespace: "contact" }),
  ]);

  const productList = await getProducts(6).catch(() => ({ items: [] }));
  const products = productList.items;

  const catalogPreview = await listDocuments({ types: ["catalog"], limit: 6 }).catch(
    () => ({ items: [], totalCount: 0, facets: { brands: [], types: [], categories: [], languages: [] } })
  );

  const intents = [
    {
      question: t("intents.part.question"),
      answer: t("intents.part.answer"),
      href: "/products",
      ctaLabel: t("intents.part.cta"),
    },
    {
      question: t("intents.repair.question"),
      answer: t("intents.repair.answer"),
      href: "/services/repair",
      ctaLabel: t("intents.repair.cta"),
    },
    {
      question: t("intents.swiss.question"),
      answer: t("intents.swiss.answer"),
      href: "/services/delivery",
      ctaLabel: t("intents.swiss.cta"),
    },
    {
      question: t("intents.catalog.question"),
      answer: t("intents.catalog.answer"),
      href: "/catalog",
      ctaLabel: t("intents.catalog.cta"),
    },
  ];

  const realityItems: RealityItem[] = [
    {
      value: t("reality.years.value"),
      label: t("reality.years.label"),
      sublabel: t("reality.years.sublabel"),
    },
    {
      value: t("reality.skus.value"),
      label: t("reality.skus.label"),
      sublabel: t("reality.skus.sublabel"),
    },
    {
      value: t("reality.repair.value"),
      label: t("reality.repair.label"),
      sublabel: t("reality.repair.sublabel"),
    },
    {
      value: t("reality.brands.value"),
      label: t("reality.brands.label"),
      sublabel: t("reality.brands.sublabel"),
    },
  ];

  const servicePillars = [
    {
      icon: ICON_CONSULTING,
      eyebrow: tServices("consulting.eyebrow"),
      title: tServices("consulting.title"),
      description: t("services.consulting"),
      href: "/services/consulting",
    },
    {
      icon: ICON_REPAIR,
      eyebrow: tServices("repair.eyebrow"),
      title: tServices("repair.title"),
      description: t("services.repair"),
      href: "/services/repair",
    },
    {
      icon: ICON_DELIVERY,
      eyebrow: tServices("delivery.eyebrow"),
      title: tServices("delivery.title"),
      description: t("services.delivery"),
      href: "/services/delivery",
    },
  ];

  return (
    <>
      <Hero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
      >
        <Cta href="/products" label={t("hero.openShop")} variant="primary" />
        <Cta href="/catalog" label={t("hero.openCatalog")} variant="white" />
      </Hero>

      <RealityStrip heading={t("reality.heading")} items={realityItems} />

      {/* Intent tiles */}
      <section className="py-14 sm:py-20">
        <div className="swr-page-shell">
          <div className="flex flex-col gap-3 mb-10 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {t("intents.eyebrow")}
            </p>
            <h2 className="text-2xl sm:text-4xl font-black uppercase text-primary tracking-[-0.02em] leading-tight">
              {t("intents.heading")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {intents.map((intent, idx) => (
              <IntentTile
                key={intent.href}
                question={intent.question}
                answer={intent.answer}
                href={intent.href}
                ctaLabel={intent.ctaLabel}
                index={idx + 1}
              />
            ))}
          </div>
        </div>
      </section>

      <CatalogPreviewRail
        heading={t("catalogPreview.heading")}
        subheading={t("catalogPreview.subheading")}
        documents={catalogPreview.items}
        viewAllLabel={t("catalogPreview.cta")}
        emptyLabel={tCatalog("emptyState")}
      />

      {/* Services pillars */}
      <section className="bg-surface-container-low py-14 sm:py-20">
        <div className="swr-page-shell flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-2">
                {t("services.eyebrow")}
              </p>
              <h2 className="text-2xl sm:text-4xl font-black uppercase text-primary tracking-[-0.02em] leading-tight">
                {t("services.heading")}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-on-surface-variant leading-relaxed">
                {t("services.subheading")}
              </p>
            </div>
            <Link
              href="/services"
              className="text-xs font-bold uppercase tracking-[0.08em] text-primary hover:underline whitespace-nowrap inline-flex items-center gap-1.5"
            >
              {t("services.cta")}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {servicePillars.map((p) => (
              <ServiceCard
                key={p.href}
                icon={p.icon}
                eyebrow={p.eyebrow}
                title={p.title}
                description={p.description}
                href={p.href}
                ctaLabel={tServices("hub.learnMore")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Industries grid (questions, not labels) */}
      <section className="py-14 sm:py-20">
        <div className="swr-page-shell flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 max-w-3xl">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-2">
                {t("industries.eyebrow")}
              </p>
              <h2 className="text-2xl sm:text-4xl font-black uppercase text-primary tracking-[-0.02em] leading-tight">
                {t("industries.heading")}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INDUSTRY_SLUGS.map((slug) => (
              <ServiceCard
                key={slug}
                eyebrow={tIndustries(`slugs.${slug}.eyebrow`)}
                title={t(`industries.questions.${slug}`)}
                description={tIndustries(`slugs.${slug}.shortBody`)}
                href={`/industries/${slug}`}
                ctaLabel={tIndustries("hub.exploreIndustry")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <div className="bg-surface-container-low py-14 sm:py-20">
        <div className="swr-page-shell">
          <FeaturedProductsRail
            heading={t("featured.heading")}
            subheading={t("featured.subheading")}
            products={products}
            viewAllHref="/products"
            viewAllLabel={t("featured.cta")}
          />
        </div>
      </div>

      {/* Real people */}
      <section className="py-14 sm:py-20">
        <div className="swr-page-shell grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 items-center">
          <div className="flex flex-col gap-3 max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {t("people.eyebrow")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-primary tracking-[-0.02em] leading-tight">
              {t("people.heading")}
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              {t("people.body")}
            </p>
            <Link
              href="/about"
              className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-primary hover:underline inline-flex items-center gap-1.5 self-start"
            >
              {t("people.cta")}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
          <PersonCard
            name={t("people.featured.name")}
            role={t("people.featured.role")}
            phone={tContact("phone")}
            email={tContact("email")}
            quote={t("people.featured.quote")}
          />
        </div>
      </section>

      <WorkshopBlock
        eyebrow={t("workshop.eyebrow")}
        heading={t("workshop.heading")}
        body={t("workshop.body")}
        contactLines={[
          {
            label: t("workshop.phoneLabel"),
            value: tContact("phone"),
            href: `tel:${tContact("phone").replace(/\s+/g, "")}`,
          },
          {
            label: t("workshop.emailLabel"),
            value: tContact("email"),
            href: `mailto:${tContact("email")}`,
          },
          {
            label: t("workshop.hoursLabel"),
            value: tContact("hours"),
          },
        ]}
      >
        <Cta href="/contact" label={tNav("bookConsultation")} variant="primary" />
        <Cta href="/products" label={tNav("allProducts")} variant="ghost" />
      </WorkshopBlock>
    </>
  );
}
