import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalPageLayout from "@/components/LegalPageLayout";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cookies" });
  return {
    title: t("heading"),
    description: t("intro"),
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cookies" });

  const rows = [
    {
      name: t("row1Name"),
      purpose: t("row1Purpose"),
      duration: t("row1Duration"),
      type: t("row1Type"),
    },
    {
      name: t("row2Name"),
      purpose: t("row2Purpose"),
      duration: t("row2Duration"),
      type: t("row2Type"),
    },
    {
      name: t("row3Name"),
      purpose: t("row3Purpose"),
      duration: t("row3Duration"),
      type: t("row3Type"),
    },
    {
      name: t("row4Name"),
      purpose: t("row4Purpose"),
      duration: t("row4Duration"),
      type: t("row4Type"),
    },
  ] as const;

  return (
    <LegalPageLayout title={t("heading")} intro={t("intro")} contact={t("contact")}>
      <div className="flex flex-col gap-10">
        <section>
          <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-3">
            {t("necessaryTitle")}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
            {t("necessaryIntro")}
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-3">
            {t("optionalTitle")}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t("optionalIntro")}
          </p>
        </section>

        <section className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-xs text-on-surface-variant border-collapse">
            <caption className="text-left text-sm font-bold text-primary mb-3">
              {t("tableCaption")}
            </caption>
            <thead>
              <tr className="bg-surface-container-low">
                <th scope="col" className="p-3 font-black uppercase tracking-wide text-primary">
                  {t("colName")}
                </th>
                <th scope="col" className="p-3 font-black uppercase tracking-wide text-primary">
                  {t("colPurpose")}
                </th>
                <th scope="col" className="p-3 font-black uppercase tracking-wide text-primary">
                  {t("colDuration")}
                </th>
                <th scope="col" className="p-3 font-black uppercase tracking-wide text-primary">
                  {t("colType")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-t border-outline-variant/25 bg-surface-container-lowest/40">
                  <td className="p-3 font-mono text-[11px] text-on-surface">{row.name}</td>
                  <td className="p-3 leading-relaxed">{row.purpose}</td>
                  <td className="p-3 whitespace-nowrap">{row.duration}</td>
                  <td className="p-3">{row.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-3">
            {t("localStorageTitle")}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t("localStorageBody")}
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
}
