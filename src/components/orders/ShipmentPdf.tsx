import { Document, Page, Text, View } from "@react-pdf/renderer";
import type {
  MagentoOrderDetail,
  MagentoShipment,
} from "@/types/magento";
import { pdfStyles as styles } from "@/components/orders/pdfStyles";
import PdfAddress from "@/components/orders/PdfAddress";

interface ShipmentPdfLabels {
  title: string;
  shipmentNumber: string;
  orderNumber: string;
  date: string;
  billingAddress: string;
  shippingAddress: string;
  sameAsBilling: string;
  product: string;
  sku: string;
  qty: string;
  tracking: string;
  carrier: string;
  trackingNumber: string;
  noTracking: string;
  companyName: string;
  companyTagline: string;
  footer: string;
}

interface ShipmentPdfProps {
  shipment: MagentoShipment;
  order: MagentoOrderDetail;
  labels: ShipmentPdfLabels;
  locale: string;
}

export default function ShipmentPdf({
  shipment,
  order,
  labels,
  locale,
}: ShipmentPdfProps) {
  const dateFmt = new Intl.DateTimeFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" },
  );

  const billing = shipment.billing_address ?? order.billing_address;
  const shipping =
    shipment.extension_attributes?.shipping_assignments?.[0]?.shipping
      ?.address ??
    order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address;
  const sameAsBilling =
    !shipping || JSON.stringify(shipping) === JSON.stringify(billing);

  const items = (shipment.items ?? []).filter((it) => (it.qty ?? 0) > 0);
  const tracks = shipment.tracks ?? [];

  return (
    <Document title={`SWR-delivery-${shipment.increment_id}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>{labels.companyName}</Text>
            <Text style={styles.tagline}>{labels.companyTagline}</Text>
          </View>
          <View style={styles.docMeta}>
            <Text style={styles.docTitle}>{labels.title}</Text>
            <Text style={styles.docMetaLine}>
              {labels.shipmentNumber}: #{shipment.increment_id}
            </Text>
            <Text style={styles.docMetaLine}>
              {labels.orderNumber}: #{order.increment_id}
            </Text>
            <Text style={styles.docMetaLine}>
              {labels.date}: {dateFmt.format(new Date(shipment.created_at))}
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
          </View>
          {items.map((item, i) => (
            <View key={item.entity_id ?? i} style={styles.tableRow} wrap={false}>
              <Text style={styles.colProduct}>{item.name ?? item.sku}</Text>
              <Text style={styles.colSku}>{item.sku}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.sectionHeading}>{labels.tracking}</Text>
          {tracks.length === 0 ? (
            <Text>{labels.noTracking}</Text>
          ) : (
            <View style={styles.trackList}>
              {tracks.map((t, i) => (
                <View key={t.entity_id ?? i} style={styles.trackRow}>
                  <Text>
                    {labels.carrier}:{" "}
                    {t.title ?? t.carrier_code ?? "—"}
                  </Text>
                  <Text>
                    {labels.trackingNumber}:{" "}
                    <Text style={styles.mono}>{t.track_number}</Text>
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.footer} fixed>
          {labels.footer}
        </Text>
      </Page>
    </Document>
  );
}
