import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { MagentoOrderDetail } from "@/types/magento";
import type { FriendlyStatus } from "@/lib/orderStatus";
import { pdfStyles as styles } from "@/components/orders/pdfStyles";

interface Labels {
  title: string;
  orderNumber: string;
  date: string;
  status: string;
  billingAddress: string;
  shippingAddress: string;
  sameAsBilling: string;
  paymentMethod: string;
  product: string;
  sku: string;
  qty: string;
  unitPrice: string;
  rowTotal: string;
  subtotal: string;
  tax: string;
  grandTotal: string;
  companyName: string;
  companyTagline: string;
  footer: string;
  statusLabel: string;
}

interface OrderConfirmationPdfProps {
  order: MagentoOrderDetail;
  labels: Labels;
  locale: string;
  friendlyStatus: FriendlyStatus;
}

function formatAddress(a?: MagentoOrderDetail["billing_address"]) {
  if (!a) return null;
  const name = [a.firstname, a.lastname].filter(Boolean).join(" ");
  const cityLine = [a.postcode, a.city].filter(Boolean).join(" ");
  return { name, cityLine, ...a };
}

export default function OrderConfirmationPdf({
  order,
  labels,
  locale,
  friendlyStatus,
}: OrderConfirmationPdfProps) {
  const currency = order.order_currency_code || "EUR";
  const fmt = new Intl.NumberFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { style: "currency", currency },
  );
  const dateFmt = new Intl.DateTimeFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" },
  );

  const billing = formatAddress(order.billing_address);
  const shippingAddress =
    order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address;
  const shipping = formatAddress(shippingAddress);
  const sameAsBilling =
    !shippingAddress ||
    JSON.stringify(shippingAddress) === JSON.stringify(order.billing_address);

  const visibleItems = order.items.filter(
    (it) => it.price > 0 || it.row_total > 0,
  );

  return (
    <Document title={`SWR-order-${order.increment_id}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>{labels.companyName}</Text>
            <Text style={styles.tagline}>{labels.companyTagline}</Text>
          </View>
          <View style={styles.docMeta}>
            <Text style={styles.docTitle}>{labels.title}</Text>
            <Text style={styles.docMetaLine}>
              {labels.orderNumber}: #{order.increment_id}
            </Text>
            <Text style={styles.docMetaLine}>
              {labels.date}: {dateFmt.format(new Date(order.created_at))}
            </Text>
            <Text style={styles.docMetaLine}>
              {labels.status}: {labels.statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.addressRow}>
          <View style={styles.addressBlock}>
            <Text style={styles.sectionHeading}>{labels.billingAddress}</Text>
            {billing ? (
              <View>
                {billing.company ? (
                  <Text style={styles.addressBold}>{billing.company}</Text>
                ) : null}
                {billing.name ? (
                  <Text
                    style={
                      billing.company ? styles.addressText : styles.addressBold
                    }
                  >
                    {billing.name}
                  </Text>
                ) : null}
                {billing.street?.map((l, i) => (
                  <Text key={i} style={styles.addressText}>
                    {l}
                  </Text>
                ))}
                {billing.cityLine ? (
                  <Text style={styles.addressText}>{billing.cityLine}</Text>
                ) : null}
                {billing.country_id ? (
                  <Text style={styles.addressText}>{billing.country_id}</Text>
                ) : null}
                {billing.telephone ? (
                  <Text style={styles.addressText}>{billing.telephone}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
          <View style={styles.addressBlock}>
            <Text style={styles.sectionHeading}>{labels.shippingAddress}</Text>
            {sameAsBilling || !shipping ? (
              <Text style={styles.addressText}>{labels.sameAsBilling}</Text>
            ) : (
              <View>
                {shipping.company ? (
                  <Text style={styles.addressBold}>{shipping.company}</Text>
                ) : null}
                {shipping.name ? (
                  <Text
                    style={
                      shipping.company ? styles.addressText : styles.addressBold
                    }
                  >
                    {shipping.name}
                  </Text>
                ) : null}
                {shipping.street?.map((l, i) => (
                  <Text key={i} style={styles.addressText}>
                    {l}
                  </Text>
                ))}
                {shipping.cityLine ? (
                  <Text style={styles.addressText}>{shipping.cityLine}</Text>
                ) : null}
                {shipping.country_id ? (
                  <Text style={styles.addressText}>{shipping.country_id}</Text>
                ) : null}
                {shipping.telephone ? (
                  <Text style={styles.addressText}>{shipping.telephone}</Text>
                ) : null}
              </View>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={styles.colProduct}>{labels.product}</Text>
            <Text style={styles.colSku}>{labels.sku}</Text>
            <Text style={styles.colQty}>{labels.qty}</Text>
            <Text style={styles.colPrice}>{labels.unitPrice}</Text>
            <Text style={styles.colTotal}>{labels.rowTotal}</Text>
          </View>
          {visibleItems.map((item) => (
            <View key={item.item_id} style={styles.tableRow} wrap={false}>
              <Text style={styles.colProduct}>{item.name}</Text>
              <Text style={styles.colSku}>{item.sku}</Text>
              <Text style={styles.colQty}>{item.qty_ordered}</Text>
              <Text style={styles.colPrice}>{fmt.format(item.price)}</Text>
              <Text style={styles.colTotal}>{fmt.format(item.row_total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>{labels.subtotal}</Text>
            <Text>{fmt.format(order.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>{labels.tax}</Text>
            <Text>{fmt.format(order.tax_amount)}</Text>
          </View>
          <View style={styles.totalRowBold}>
            <Text>{labels.grandTotal}</Text>
            <Text>{fmt.format(order.grand_total)}</Text>
          </View>
        </View>

        {order.payment?.method ? (
          <View style={styles.paymentBlock}>
            <Text style={styles.sectionHeading}>{labels.paymentMethod}</Text>
            <Text>{order.payment.method}</Text>
          </View>
        ) : null}

        <Text style={styles.footer} fixed>
          {labels.footer}
        </Text>

        {/* friendlyStatus is accepted for forward-compatible PDF styling hooks */}
        {friendlyStatus ? null : null}
      </Page>
    </Document>
  );
}
