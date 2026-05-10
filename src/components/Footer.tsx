import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

interface FooterProps {
  locale: string;
}

interface LinkItem {
  href: string;
  label: string;
}

interface Column {
  heading: string;
  links: LinkItem[];
}

export default async function Footer({ locale }: FooterProps) {
  const [t, tNav, tContact, tServices] = await Promise.all([
    getTranslations({ locale, namespace: "footer" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "contact" }),
    getTranslations({ locale, namespace: "services" }),
  ]);

  const columns: Column[] = [
    {
      heading: t("shopHeading"),
      links: [
        { href: "/products", label: tNav("allProducts") },
        { href: "/catalog", label: tNav("catalog") },
        { href: "/offers", label: tNav("offers") },
        { href: "/industries", label: tNav("industries") },
      ],
    },
    {
      heading: t("servicesHeading"),
      links: [
        { href: "/services/consulting", label: tServices("consulting.title") },
        { href: "/services/repair", label: tServices("repair.title") },
        { href: "/services/delivery", label: tServices("delivery.title") },
      ],
    },
    {
      heading: t("companyHeading"),
      links: [
        { href: "/about", label: tNav("about") },
        { href: "/partners", label: tNav("partners") },
        { href: "/careers", label: tNav("careers") },
        { href: "/certificates", label: tNav("certificates") },
        { href: "/account/fleet", label: tNav("fleet") },
        { href: "/contact", label: tNav("contact") },
      ],
    },
    {
      heading: t("legalHeading"),
      links: [
        { href: "/legal/imprint", label: t("imprint") },
        { href: "/legal/terms", label: t("termsOfSale") },
        { href: "/legal/privacy", label: t("privacyPolicy") },
        { href: "/legal/compliance", label: t("compliance") },
        { href: "/legal/sds", label: t("sdsSheets") },
      ],
    },
  ];

  return (
    <footer className="bg-primary text-white mt-auto">
      <div className="swr-page-shell py-10 sm:py-14 grid grid-cols-2 lg:grid-cols-5 gap-7 sm:gap-8 lg:gap-10">
        <div className="col-span-2 lg:col-span-1 flex flex-col gap-3">
          <span className="text-base font-black tracking-[0.04em] uppercase text-white">
            SWR Handelsgesellschaft mbH
          </span>
          <p className="text-xs text-white/70 leading-relaxed">
            Qualität verbindet.
          </p>
          <address className="not-italic text-xs text-white/80 leading-relaxed">
            {tContact("company")}
            <br />
            {tContact("street")}
            <br />
            {tContact("city")}
          </address>
          <div className="flex flex-col gap-1 mt-2">
            <a
              href={`tel:${tContact("phone").replace(/\s+/g, "")}`}
              className="text-xs text-white/80 hover:text-white transition-colors"
            >
              {tContact("phoneLabel")}: {tContact("phone")}
            </a>
            <a
              href={`mailto:${tContact("email")}`}
              className="text-xs text-white/80 hover:text-white transition-colors"
            >
              {tContact("email")}
            </a>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.heading} className="flex flex-col gap-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/90 mb-1">
              {col.heading}
            </h3>
            <ul className="flex flex-col gap-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-xs text-white/70 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="swr-page-shell py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-[11px] text-white/60">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          <p className="text-[11px] text-white/50 uppercase tracking-[0.08em]">
            Lörrach · Deutschland
          </p>
        </div>
      </div>
    </footer>
  );
}
