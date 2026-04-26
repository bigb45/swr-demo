import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCmsPage } from "@/lib/cms";
import CmsContent from "@/components/CmsContent";
import LegalPageLayout from "@/components/LegalPageLayout";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCmsPage("imprint", locale);
  const t = await getTranslations({ locale, namespace: "imprint" });
  return {
    title: page?.meta_title ?? t("heading"),
    description: page?.meta_description ?? t("intro"),
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const [page, t] = await Promise.all([
    getCmsPage("imprint", locale),
    getTranslations({ locale, namespace: "imprint" }),
  ]);

  if (page) {
    return (
      <LegalPageLayout title={page.content_heading ?? page.title}>
        <CmsContent html={page.content} />
      </LegalPageLayout>
    );
  }

  return (
    <LegalPageLayout
      title={t("heading")}
      intro={t("intro")}
      contact={t("contact")}
    >
      <div className="flex flex-col gap-8">
        <section>
          <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-3">
            {t("companyHeading")}
          </h2>
          <address className="not-italic text-sm text-on-surface-variant leading-relaxed">
            <div className="font-bold text-on-surface">{t("company")}</div>
            <div>{t("street")}</div>
            <div>{t("city")}</div>
            <div>{t("country")}</div>
          </address>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-3">
            {t("contactHeading")}
          </h2>
          <dl className="text-sm text-on-surface-variant leading-relaxed grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="font-semibold">{t("phoneLabel")}</dt>
            <dd>{t("phone")}</dd>
            <dt className="font-semibold">{t("faxLabel")}</dt>
            <dd>{t("fax")}</dd>
            <dt className="font-semibold">{t("emailLabel")}</dt>
            <dd>
              <a href={`mailto:${t("email")}`} className="underline hover:no-underline">
                {t("email")}
              </a>
            </dd>
          </dl>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-3">
            {t("representativeHeading")}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t("representativeBody")}
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-3">
            {t("registrationHeading")}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t("registrationBody")}
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-3">
            {t("vatHeading")}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t("vatBody")}
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-3">
            {t("disputeHeading")}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t("disputeBody")}
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
}
