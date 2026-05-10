import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  getQuotationForCustomer,
  quotationStatusTone,
} from "@/lib/quotations";
import AcceptButton from "./AcceptButton";

interface QuotationDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function QuotationDetailPage({
  params,
}: QuotationDetailPageProps) {
  const { locale, id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) {
    redirect(`/${locale}/account/login`);
  }

  const t = await getTranslations({ locale, namespace: "quotations" });

  const quotation = await getQuotationForCustomer(id, token);

  if (!quotation) {
    notFound();
  }

  const currency = quotation.currency || "EUR";
  const fmt = new Intl.NumberFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { style: "currency", currency },
  );
  const dateFmt = new Intl.DateTimeFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const canAccept = quotation.status === "open";

  return (
    <div className="swr-page-shell py-10">
      <div className="mx-auto w-full max-w-[900px]">
      <Link
        href="/account/quotations"
        className="text-xs font-bold text-secondary hover:underline mb-6 inline-block"
      >
        {t("backToQuotations")}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary">
            {t("quotationNumber", { id: quotation.number })}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {dateFmt.format(new Date(quotation.created_at))}
            {quotation.valid_until ? (
              <>
                {" · "}
                {t("validUntil", {
                  date: dateFmt.format(new Date(quotation.valid_until)),
                })}
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start sm:items-end shrink-0">
          <span
            className={`inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded ${quotationStatusTone(quotation.status)}`}
          >
            {t(`status.${quotation.status}`)}
          </span>
          <a
            href={`/api/account/quotations/${encodeURIComponent(quotation.id)}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-secondary hover:underline"
          >
            {t("downloadPdf")}
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant bg-surface-container-low">
              <th className="text-left px-4 py-2">{t("colProduct")}</th>
              <th className="text-left px-4 py-2">{t("colSku")}</th>
              <th className="text-right px-4 py-2">{t("colQty")}</th>
              <th className="text-right px-4 py-2">{t("colUnitPrice")}</th>
              <th className="text-right px-4 py-2">{t("colRowTotal")}</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item) => (
              <tr
                key={item.sku}
                className="border-b border-outline-variant/20"
              >
                <td className="px-4 py-3 font-medium text-on-surface">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {item.sku}
                </td>
                <td className="px-4 py-3 text-right text-on-surface">
                  {item.qty}
                </td>
                <td className="px-4 py-3 text-right text-on-surface">
                  {fmt.format(item.unit_price)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-on-surface">
                  {fmt.format(item.row_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-on-surface-variant">
            <span>{t("subtotal")}</span>
            <span>{fmt.format(quotation.subtotal)}</span>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>{t("tax")}</span>
            <span>{fmt.format(quotation.tax_amount)}</span>
          </div>
          <div className="flex justify-between font-bold text-on-surface border-t border-outline-variant/30 pt-2">
            <span>{t("grandTotal")}</span>
            <span>{fmt.format(quotation.grand_total)}</span>
          </div>
        </div>
      </div>

      {canAccept ? (
        <div className="mt-8 flex justify-end">
          <AcceptButton quotationId={quotation.id} />
        </div>
      ) : null}

      {quotation.notes ? (
        <div className="mt-10 bg-surface-container-lowest rounded-card p-5 shadow-ambient">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
            {t("notes")}
          </h2>
          <p className="text-sm text-on-surface whitespace-pre-wrap">
            {quotation.notes}
          </p>
        </div>
      ) : null}
      </div>
    </div>
  );
}
