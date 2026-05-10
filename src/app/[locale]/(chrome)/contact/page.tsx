import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCmsPage } from "@/lib/cms";
import CmsContent from "@/components/CmsContent";
import { Hero, ContactCard } from "@/components/marketing";
import type { ContactLine } from "@/components/marketing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCmsPage("contact", locale);
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: page?.meta_title ?? t("heading"),
    description: page?.meta_description ?? t("subheading"),
  };
}

const ICON_PHONE = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const ICON_FAX = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);
const ICON_MAIL = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const ICON_CLOCK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const [page, t] = await Promise.all([
    getCmsPage("contact", locale),
    getTranslations({ locale, namespace: "contact" }),
  ]);

  const phone = t("phone");
  const fax = t("fax");
  const email = t("email");

  const lines: ContactLine[] = [
    { icon: ICON_PHONE, label: t("phoneLabel"), value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
    { icon: ICON_FAX, label: t("faxLabel"), value: fax },
    { icon: ICON_MAIL, label: t("emailLabel"), value: email, href: `mailto:${email}` },
    { icon: ICON_CLOCK, label: t("hoursLabel"), value: t("hours") },
  ];

  return (
    <>
      <Hero
        eyebrow={t("eyebrow")}
        title={page?.content_heading ?? page?.title ?? t("heading")}
        subtitle={page?.meta_description ?? t("subheading")}
        variant="compact"
      />

      <div className="swr-page-shell py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10">
        <div className="flex flex-col gap-6">
          {page ? (
            <CmsContent html={page.content} />
          ) : (
            <div className="swr-prose">
              <h2>{t("reachOutHeading")}</h2>
              <p>{t("reachOutBody")}</p>
              <h3>{t("consultationHeading")}</h3>
              <p>{t("consultationBody")}</p>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <ContactCard
            title={t("cardTitle")}
            address={{
              company: t("company"),
              street: t("street"),
              city: t("city"),
            }}
            lines={lines}
          />
        </aside>
      </div>
    </>
  );
}
