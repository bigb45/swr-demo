import { getTranslations } from "next-intl/server";

interface SdsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SdsPage({ params }: SdsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sds" });

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-8 py-12">
      <h1 className="text-3xl font-black text-primary mb-2">{t("heading")}</h1>
      <p className="text-sm text-on-surface-variant mb-10 leading-relaxed">{t("intro")}</p>

      <div className="flex flex-col gap-8">
        {(["section1", "section2"] as const).map((s) => (
          <section key={s}>
            <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-3">
              {t(`${s}Heading`)}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">{t(`${s}Body`)}</p>
          </section>
        ))}
      </div>

      <p className="mt-12 text-xs text-on-surface-variant/70 border-t border-outline-variant/30 pt-6">
        {t("contact")}
      </p>
    </div>
  );
}
