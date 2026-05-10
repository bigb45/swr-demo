import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import AddressBlock from "@/components/orders/AddressBlock";
import DocumentsSection from "@/components/orders/DocumentsSection";
import ReorderButton from "@/components/orders/ReorderButton";
import { getOrderDocuments, getOrderForCustomer } from "@/lib/orders";
import { resolveOrderStatus, statusBadgeClasses } from "@/lib/orderStatus";
import { listCasesForOrder } from "@/lib/service";

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
  const tService = await getTranslations({ locale, namespace: "service" });
  const order = await getOrderForCustomer(id, token);

  if (!order) {
    notFound();
  }

  const [documents, serviceCases] = await Promise.all([
    getOrderDocuments(order.entity_id),
    listCasesForOrder(String(order.entity_id)),
  ]);

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

  // For reorder we intentionally skip child lines of configurable/bundle
  // parents (their SKU is the variant, but Magento needs the parent SKU +
  // `product_option` to re-add them). The parent row carries the name.
  const reorderLines = order.items
    .filter((item) => !item.parent_item_id)
    .map((item) => ({
      sku: item.sku,
      name: item.name,
      qty: item.qty_ordered,
      productType: item.product_type,
    }));

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

  // Magento mixes internal staff notes and customer-facing comments in the
  // same `status_histories` array — only render entries flagged
  // `is_visible_on_front` with a non-empty body. Newest first.
  const visibleComments = (order.status_histories ?? [])
    .filter(
      (entry) =>
        Number(entry.is_visible_on_front) === 1 &&
        typeof entry.comment === "string" &&
        entry.comment.trim().length > 0,
    )
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime(),
    );

  return (
    <div className="swr-page-shell py-10">
      <div className="mx-auto w-full max-w-[900px]">
      <Link
        href="/orders"
        className="text-xs font-bold text-secondary hover:underline mb-6 inline-block"
      >
        {t("backToOrders")}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary">
            {t("orderNumber", { id: order.increment_id })}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {dateFmt.format(new Date(order.created_at))}
          </p>
          <span
            className={`inline-block mt-3 px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded ${badgeClasses}`}
          >
            {resolved.label}
          </span>
        </div>
        <ReorderButton locale={locale} items={reorderLines} />
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

      {/* Comments from Magento (status history entries flagged visible-on-front) */}
      {visibleComments.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">
            {t("comments")}
          </h2>
          <ol className="space-y-3">
            {visibleComments.map((entry, idx) => (
              <li
                key={entry.entity_id ?? `${entry.created_at ?? "comment"}-${idx}`}
                className="bg-surface-container-lowest rounded-card p-4 shadow-ambient"
              >
                {entry.created_at ? (
                  <p className="text-xs text-on-surface-variant mb-1">
                    {dateFmt.format(new Date(entry.created_at))}
                  </p>
                ) : null}
                <p className="text-sm text-on-surface whitespace-pre-line">
                  {entry.comment}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Service cases tied to this order */}
      <section className="mt-10 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            {tService("orderSection.heading")}
          </h2>
          <div className="flex flex-wrap gap-2 justify-end">
            <Link
              href={`/account/service/new?kind=return&orderId=${order.entity_id}`}
              className="text-xs font-bold uppercase tracking-[0.12em] bg-primary text-white px-4 py-3 hover:bg-primary-container transition-colors"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              {tService("orderSection.startReturn")}
            </Link>
            <Link
              href={`/account/service/new?kind=repair&orderId=${order.entity_id}`}
              className="text-xs font-bold uppercase tracking-[0.12em] border border-primary text-primary bg-surface-container-lowest px-4 py-3 hover:bg-primary-fixed transition-colors"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              {tService("orderSection.startRepair")}
            </Link>
          </div>
        </div>
        {serviceCases.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {serviceCases.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/account/service/${c.id}`}
                  className="flex flex-wrap items-center gap-3 p-4 bg-surface-container-lowest hover:bg-primary-fixed transition-colors"
                  style={{
                    borderRadius: "var(--radius-card)",
                    boxShadow: "var(--shadow-ambient)",
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-primary text-white" style={{ borderRadius: "var(--radius-btn)" }}>
                    {tService(`kind.${c.kind}`)}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-secondary/10 text-secondary" style={{ borderRadius: "var(--radius-btn)" }}>
                    {tService(`status.${c.status}`)}
                  </span>
                  <span className="font-mono text-xs text-on-surface-variant">{c.id}</span>
                  <span className="text-sm text-on-surface flex-1 truncate">{c.description}</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">{tService("viewCase")} →</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-on-surface-variant">
            {tService("orderSection.empty")}
          </p>
        )}
      </section>

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
    </div>
  );
}
