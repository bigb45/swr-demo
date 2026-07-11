import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  listCustomerQuotations,
  quotationStatusTone,
} from "@/lib/quotations";

interface QuotationsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function QuotationsPage({ params }: QuotationsPageProps) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) {
    redirect(`/${locale}/account/login`);
  }

  const t = await getTranslations({ locale, namespace: "quotations" });

  const quotations = await listCustomerQuotations(token);

  const fmt = new Intl.NumberFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { style: "currency", currency: "EUR" },
  );

  const dateFmt = new Intl.DateTimeFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { year: "numeric", month: "short", day: "numeric" },
  );

  return (
    <div className="swr-page-shell py-10">
      <div className="mx-auto w-full max-w-[1280px]">
      <Link
        href="/account"
        className="mb-6 inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
      >
        <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
        {t("backToAccount")}
      </Link>

      <h1 className="text-3xl font-black text-primary mb-2">{t("heading")}</h1>
      <p className="text-sm text-on-surface-variant mb-8">{t("subheading")}</p>

      {quotations.length > 0 ? (
        <>
          <div
            className="hidden sm:grid text-xs font-semibold text-on-surface-variant bg-surface-container-low px-4 py-2 mb-1"
            style={{ gridTemplateColumns: "1fr 160px 140px 120px 80px" }}
          >
            <span>{t("colQuotation")}</span>
            <span>{t("colDate")}</span>
            <span>{t("colStatus")}</span>
            <span className="text-right">{t("colTotal")}</span>
            <span />
          </div>

          {quotations.map((q) => {
            const currency = q.currency || "EUR";
            const currencyFmt =
              currency === "EUR"
                ? fmt
                : new Intl.NumberFormat(
                    locale === "de"
                      ? "de-DE"
                      : locale === "fr"
                        ? "fr-FR"
                        : "en-GB",
                    { style: "currency", currency },
                  );
            return (
              <div
                key={q.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_160px_140px_120px_80px] items-center gap-1 sm:gap-0 px-4 py-3 border-b border-outline-variant/20 text-sm"
              >
                <span className="font-bold text-on-surface">#{q.number}</span>
                <span className="text-on-surface-variant">
                  {dateFmt.format(new Date(q.created_at))}
                </span>
                <span>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold ${quotationStatusTone(q.status)}`}
                  >
                    {t(`status.${q.status}`)}
                  </span>
                </span>
                <span className="text-right font-medium text-on-surface">
                  {currencyFmt.format(q.grand_total)}
                </span>
                <span className="text-right">
                  <Link
                    href={`/account/quotations/${q.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
                  >
                    {t("viewQuotation")}
                    <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                </span>
              </div>
            );
          })}
        </>
      ) : (
        <div className="py-12 px-6 text-left text-on-surface bg-surface-container-low max-w-xl">
          <h2 className="text-base font-bold text-primary mb-2">
            {t("empty")}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t("emptyHint")}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
