import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCmsPage } from "@/lib/cms";
import CmsContent from "@/components/CmsContent";
import { Hero, CertificateCard, Cta } from "@/components/marketing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getCmsPage("certificates", locale);
  const t = await getTranslations({ locale, namespace: "certificates" });
  return {
    title: page?.meta_title ?? t("heading"),
    description: page?.meta_description ?? t("subheading"),
  };
}

// Certificate list — kept as a stable client-side list until Magento admins
// upload PDFs. Once uploaded, swap `href` for the media URL. The page
// continues to function even without downloads.
const CERTIFICATE_KEYS = [
  "iso9001",
  "iso14001",
  "aeo",
  "welding",
] as const;

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const [page, t] = await Promise.all([
    getCmsPage("certificates", locale),
    getTranslations({ locale, namespace: "certificates" }),
  ]);

  return (
    <>
      <Hero
        eyebrow={t("eyebrow")}
        title={page?.content_heading ?? page?.title ?? t("heading")}
        subtitle={page?.meta_description ?? t("subheading")}
      >
        <Cta href="/contact" label={t("requestCopy")} variant="primary" />
      </Hero>

      <div className="swr-page-shell py-12 sm:py-16 flex flex-col gap-12">
        {page ? (
          <CmsContent html={page.content} />
        ) : (
          <div className="swr-prose max-w-[800px]">
            <p>{t("intro")}</p>
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CERTIFICATE_KEYS.map((key) => (
            <CertificateCard
              key={key}
              title={t(`items.${key}.title`)}
              issuer={t(`items.${key}.issuer`)}
              validUntil={t(`items.${key}.validUntil`)}
              downloadLabel={t("download")}
            />
          ))}
        </section>

        <p className="text-xs text-on-surface-variant/80 max-w-[800px]">
          {t("requestNote")}
        </p>
      </div>
    </>
  );
}
