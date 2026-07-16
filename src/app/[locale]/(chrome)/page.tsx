import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Headset, Wrench, Truck, FileCheck, ArrowRight } from "lucide-react";
import { getProducts } from "@/lib/magento";
import {
  Hero,
  Cta,
  ServiceCard,
  RealityStrip,
  PersonCard,
  PartnerLogoCarousel,
  WorkshopBlock,
  FeaturedProductsRail,
} from "@/components/marketing";
import CopilotHero from "@/components/copilot/CopilotHero";
import type { RealityItem } from "@/components/marketing";
import { PARTNER_BRANDS } from "@/lib/partners";

export const revalidate = 60;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const [t, tNav, tServices, tContact] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "services" }),
    getTranslations({ locale, namespace: "contact" }),
  ]);

  const productList = await getProducts(4).catch(() => ({ items: [] }));
  const products = productList.items;

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
      icon: <Headset size={26} strokeWidth={1.5} aria-hidden />,
      eyebrow: tServices("consulting.eyebrow"),
      title: tServices("consulting.title"),
      description: t("services.consulting"),
      href: "/services/consulting",
    },
    {
      icon: <Wrench size={26} strokeWidth={1.5} aria-hidden />,
      eyebrow: tServices("repair.eyebrow"),
      title: tServices("repair.title"),
      description: t("services.repair"),
      href: "/services/repair",
    },
    {
      icon: <Truck size={26} strokeWidth={1.5} aria-hidden />,
      eyebrow: tServices("delivery.eyebrow"),
      title: tServices("delivery.title"),
      description: t("services.delivery"),
      href: "/services/delivery",
    },
    {
      icon: <FileCheck size={26} strokeWidth={1.5} aria-hidden />,
      eyebrow: tServices("customs.eyebrow"),
      title: tServices("customs.title"),
      description: t("services.customs"),
      href: "/services/customs",
    },
  ];

  const heroMedia = (
    <div
      className="relative aspect-square overflow-hidden"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "0 20px 40px rgba(0,18,40,0.4)",
      }}
    >
      <Image
        src="/hero-valve.png"
        alt=""
        width={620}
        height={620}
        priority
        sizes="(max-width: 1024px) 220px, 40vw"
        className="h-full w-full object-cover object-center"
      />
    </div>
  );

  return (
    <>
      <Hero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        media={heroMedia}
      >
        <Cta href="/shop" label={t("hero.openShop")} variant="primary" />
        <Cta href="/catalog" label={t("hero.openCatalog")} variant="white" />
      </Hero>

      {/* Live shop slice */}
      <section className="bg-surface-container-low py-14 sm:py-20">
        <div className="swr-page-shell swr-reveal">
          <FeaturedProductsRail
            heading={t("featured.heading")}
            subheading={t("featured.subheading")}
            products={products}
            viewAllHref="/shop"
            viewAllLabel={t("featured.cta")}
          />
        </div>
      </section>

      <RealityStrip heading={t("reality.heading")} items={realityItems} />

      <CopilotHero />

      <PartnerLogoCarousel
        heading={t("partners.heading")}
        subheading={t("partners.subheading")}
        partners={PARTNER_BRANDS}
        previousLabel={t("partners.previous")}
        nextLabel={t("partners.next")}
      />

      {/* Service commitments */}
      <section className="bg-surface-container-low py-14 sm:py-20">
        <div className="swr-page-shell flex flex-col gap-8">
          <div className="swr-reveal flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                <span aria-hidden className="inline-block h-1.5 w-1.5 bg-secondary" />
                {t("services.eyebrow")}
              </p>
              <h2 className="text-2xl font-black uppercase leading-tight tracking-[-0.02em] text-primary sm:text-4xl">
                {t("services.heading")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant sm:text-base">
                {t("services.subheading")}
              </p>
            </div>
            <Link
              href="/services"
              className="group inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-bold uppercase tracking-[0.08em] text-primary hover:underline"
            >
              {t("services.cta")}
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {servicePillars.map((p, i) => (
              <div
                key={p.href}
                className="swr-reveal swr-lift h-full"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <ServiceCard
                  icon={p.icon}
                  eyebrow={p.eyebrow}
                  title={p.title}
                  description={p.description}
                  href={p.href}
                  ctaLabel={tServices("hub.learnMore")}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The people behind the shop */}
      <section className="py-14 sm:py-20">
        <div className="swr-page-shell swr-reveal grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex max-w-md flex-col gap-3">
            <h2 className="text-2xl font-black uppercase leading-tight tracking-[-0.02em] text-primary sm:text-3xl">
              {t("people.heading")}
            </h2>
            <p className="text-sm leading-relaxed text-on-surface-variant sm:text-base">
              {t("people.body")}
            </p>
            <Link
              href="/about"
              className="group mt-2 inline-flex items-center gap-1.5 self-start text-xs font-bold uppercase tracking-[0.08em] text-primary hover:underline"
            >
              {t("people.cta")}
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
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
        <Cta
          href="/contact"
          label={tNav("bookConsultation")}
          variant="primary"
        />
        <Cta href="/shop" label={tNav("allProducts")} variant="ghost" />
      </WorkshopBlock>
    </>
  );
}
