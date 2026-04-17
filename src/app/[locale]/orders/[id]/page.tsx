import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import AddressBlock from "@/components/orders/AddressBlock";
import DocumentsSection from "@/components/orders/DocumentsSection";
import { getOrderDocuments, getOrderForCustomer } from "@/lib/orders";
import { resolveOrderStatus, statusBadgeClasses } from "@/lib/orderStatus";

interface OrderDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { locale, id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) {
    redirect(`/${locale}/account/login`);
  }

  const t = await getTranslations({ locale, namespace: "orders" });
  const order = await getOrderForCustomer(id, token);

  if (!order) {
    notFound();
  }

  const documents = await getOrderDocuments(order.entity_id);

  const currency = order.order_currency_code || "EUR";
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
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  const visibleItems = order.items.filter(
    (item) => item.price > 0 || item.row_total > 0,
  );

  const resolved = resolveOrderStatus(order, t);
  const badgeClasses = statusBadgeClasses(resolved.tone);

  const billing = order.billing_address;
  const shipping =
    order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address;
  const sameAsBilling =
    !shipping ||
    JSON.stringify(shipping) === JSON.stringify(billing);

  const paymentMethod = order.payment?.method;
  const poRef = order.payment?.po_number;

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-10">
      <Link
        href="/orders"
        className="text-xs font-bold text-secondary hover:underline mb-6 inline-block"
      >
        {t("backToOrders")}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary">
            {t("orderNumber", { id: order.increment_id })}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {dateFmt.format(new Date(order.created_at))}
          </p>
        </div>
        <span
          className={`inline-block self-start px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded ${badgeClasses}`}
        >
          {resolved.label}
        </span>
      </div>

      {/* Billing + shipping + payment */}
      <div className="grid gap-4 md:grid-cols-3 mb-10">
        <AddressBlock title={t("billingAddress")} address={billing} />
        <AddressBlock
          title={t("shippingAddress")}
          address={sameAsBilling ? undefined : shipping}
          fallback={t("sameAsBilling")}
        />
        <div className="bg-surface-container-lowest rounded-card p-5 shadow-ambient">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">
            {t("paymentMethod")}
          </h2>
          <div className="text-sm text-on-surface">
            {paymentMethod ? (
              <span className="font-medium">{paymentMethod}</span>
            ) : (
              <span className="text-on-surface-variant">—</span>
            )}
          </div>
          {poRef ? (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1">
                {t("poReference")}
              </h3>
              <div className="text-sm font-mono text-on-surface">{poRef}</div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Line items */}
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
            {visibleItems.map((item) => (
              <tr
                key={item.item_id}
                className="border-b border-outline-variant/20"
              >
                <td className="px-4 py-3 font-medium text-on-surface">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {item.sku}
                </td>
                <td className="px-4 py-3 text-right text-on-surface">
                  {item.qty_ordered}
                </td>
                <td className="px-4 py-3 text-right text-on-surface">
                  {fmt.format(item.price)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-on-surface">
                  {fmt.format(item.row_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-on-surface-variant">
            <span>{t("subtotal")}</span>
            <span>{fmt.format(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>{t("tax")}</span>
            <span>{fmt.format(order.tax_amount)}</span>
          </div>
          <div className="flex justify-between font-bold text-on-surface border-t border-outline-variant/30 pt-2">
            <span>{t("grandTotal")}</span>
            <span>{fmt.format(order.grand_total)}</span>
          </div>
        </div>
      </div>

      {/* Documents */}
      <DocumentsSection
        locale={locale}
        orderId={order.entity_id}
        invoices={documents.invoices}
        shipments={documents.shipments}
        creditmemos={documents.creditmemos}
        currency={currency}
        labels={{
          heading: t("documents"),
          invoices: t("invoices"),
          shipments: t("shipments"),
          creditmemos: t("creditmemos"),
          downloadConfirmation: t("downloadConfirmation"),
          download: t("download"),
          downloadInvoice: t("downloadInvoice"),
          downloadShipment: t("downloadShipment"),
          downloadCreditmemo: t("downloadCreditmemo"),
          trackingNumber: t("trackingNumber"),
          noDocuments: t("noDocuments"),
        }}
      />
    </div>
  );
}
