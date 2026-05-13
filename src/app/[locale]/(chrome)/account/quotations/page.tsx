import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
        className="text-xs font-bold text-secondary hover:underline mb-6 inline-block"
      >
        {t("backToAccount")}
      </Link>

      <h1 className="text-3xl font-black text-primary mb-2">{t("heading")}</h1>
      <p className="text-sm text-on-surface-variant mb-8">{t("subheading")}</p>

      {quotations.length > 0 ? (
        <>
          <div
            className="hidden sm:grid text-xs font-semibold uppercase tracking-wide text-on-surface-variant bg-surface-container-low px-4 py-2 mb-1 rounded-t"
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
                    className={`inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wide rounded ${quotationStatusTone(q.status)}`}
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
                    className="text-xs font-bold text-secondary hover:underline"
                  >
                    {t("viewQuotation")}
                  </Link>
                </span>
              </div>
            );
          })}
        </>
      ) : (
        <div className="py-16 text-center text-on-surface-variant bg-surface-container-lowest rounded-card">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-4 opacity-30"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <p className="text-sm font-medium">{t("empty")}</p>
          <p className="text-xs mt-2 max-w-md mx-auto">{t("emptyHint")}</p>
        </div>
      )}
      </div>
    </div>
  );
}
