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
  const page = await getCmsPage("sds", locale);
  const t = await getTranslations({ locale, namespace: "sds" });
  return {
    title: page?.meta_title ?? t("heading"),
    description: page?.meta_description ?? t("intro"),
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const [page, t] = await Promise.all([
    getCmsPage("sds", locale),
    getTranslations({ locale, namespace: "sds" }),
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
        {(["section1", "section2"] as const).map((s) => (
          <section key={s}>
            <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-3">
              {t(`${s}Heading`)}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t(`${s}Body`)}
            </p>
          </section>
        ))}
      </div>
    </LegalPageLayout>
  );
}
