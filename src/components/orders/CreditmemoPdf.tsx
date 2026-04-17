import { Document, Page, Text, View } from "@react-pdf/renderer";
import type {
  MagentoCreditmemo,
  MagentoOrderDetail,
} from "@/types/magento";
import { pdfStyles as styles } from "@/components/orders/pdfStyles";
import PdfAddress from "@/components/orders/PdfAddress";

interface CreditmemoPdfLabels {
  title: string;
  creditmemoNumber: string;
  orderNumber: string;
  date: string;
  billingAddress: string;
  shippingAddress: string;
  sameAsBilling: string;
  product: string;
  sku: string;
  qty: string;
  unitPrice: string;
  rowTotal: string;
  subtotal: string;
  tax: string;
  shipping: string;
  adjustment: string;
  refundTotal: string;
  companyName: string;
  companyTagline: string;
  footer: string;
}

interface CreditmemoPdfProps {
  creditmemo: MagentoCreditmemo;
  order: MagentoOrderDetail;
  labels: CreditmemoPdfLabels;
  locale: string;
}

export default function CreditmemoPdf({
  creditmemo,
  order,
  labels,
  locale,
}: CreditmemoPdfProps) {
  const currency =
    creditmemo.order_currency_code ?? order.order_currency_code ?? "EUR";
  const fmt = new Intl.NumberFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { style: "currency", currency },
  );
  const dateFmt = new Intl.DateTimeFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" },
  );

  const billing = creditmemo.billing_address ?? order.billing_address;
  const shipping =
    creditmemo.extension_attributes?.shipping_assignments?.[0]?.shipping
      ?.address ??
    order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address;
  const sameAsBilling =
    !shipping || JSON.stringify(shipping) === JSON.stringify(billing);

  const items = (creditmemo.items ?? []).filter(
    (it) => (it.qty ?? 0) > 0 && ((it.price ?? 0) > 0 || (it.row_total ?? 0) > 0),
  );

  const subtotal = creditmemo.subtotal ?? 0;
  const tax = creditmemo.tax_amount ?? 0;
  const shippingAmount = creditmemo.shipping_amount ?? 0;
  const adjustment = creditmemo.adjustment ?? 0;

  return (
    <Document title={`SWR-credit-${creditmemo.increment_id}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>{labels.companyName}</Text>
            <Text style={styles.tagline}>{labels.companyTagline}</Text>
          </View>
          <View style={styles.docMeta}>
            <Text style={styles.docTitle}>{labels.title}</Text>
            <Text style={styles.docMetaLine}>
              {labels.creditmemoNumber}: #{creditmemo.increment_id}
            </Text>
            <Text style={styles.docMetaLine}>
              {labels.orderNumber}: #{order.increment_id}
            </Text>
            <Text style={styles.docMetaLine}>
              {labels.date}: {dateFmt.format(new Date(creditmemo.created_at))}
            </Text>
          </View>
        </View>

        <View style={styles.addressRow}>
          <PdfAddress heading={labels.billingAddress} address={billing} />
          <PdfAddress
            heading={labels.shippingAddress}
            address={sameAsBilling ? undefined : shipping}
            fallback={labels.sameAsBilling}
          />
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={styles.colProduct}>{labels.product}</Text>
            <Text style={styles.colSku}>{labels.sku}</Text>
            <Text style={styles.colQty}>{labels.qty}</Text>
            <Text style={styles.colPrice}>{labels.unitPrice}</Text>
            <Text style={styles.colTotal}>{labels.rowTotal}</Text>
          </View>
          {items.map((item, i) => (
            <View key={item.entity_id ?? i} style={styles.tableRow} wrap={false}>
              <Text style={styles.colProduct}>{item.name ?? item.sku}</Text>
              <Text style={styles.colSku}>{item.sku}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colPrice}>
                {fmt.format(item.price ?? 0)}
              </Text>
              <Text style={styles.colTotal}>
                {fmt.format(item.row_total ?? 0)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>{labels.subtotal}</Text>
            <Text>{fmt.format(subtotal)}</Text>
          </View>
          {shippingAmount > 0 ? (
            <View style={styles.totalRow}>
              <Text>{labels.shipping}</Text>
              <Text>{fmt.format(shippingAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text>{labels.tax}</Text>
            <Text>{fmt.format(tax)}</Text>
          </View>
          {adjustment !== 0 ? (
            <View style={styles.totalRow}>
              <Text>{labels.adjustment}</Text>
              <Text>{fmt.format(adjustment)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRowBold}>
            <Text>{labels.refundTotal}</Text>
            <Text>{fmt.format(creditmemo.grand_total)}</Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          {labels.footer}
        </Text>
      </Page>
    </Document>
  );
}
