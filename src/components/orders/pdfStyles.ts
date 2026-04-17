import { StyleSheet } from "@react-pdf/renderer";

/**
 * Shared react-pdf stylesheet used by the order confirmation, invoice,
 * shipment, and credit memo PDFs. Keeping all documents on one style sheet
 * guarantees a uniform SWR-branded look and lets us tweak layout centrally.
 */
export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1c1c",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#003a63",
  },
  brand: { fontSize: 18, fontWeight: "bold", color: "#003a63" },
  tagline: { fontSize: 9, color: "#555", marginTop: 2 },
  docMeta: { textAlign: "right" },
  docTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#003a63",
    marginBottom: 4,
  },
  docMetaLine: { fontSize: 9, color: "#333" },
  sectionHeading: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#555",
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  addressBlock: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f3f3f3",
    borderRadius: 3,
  },
  addressText: { fontSize: 10, lineHeight: 1.4 },
  addressBold: { fontSize: 10, fontWeight: "bold", lineHeight: 1.4 },
  table: {
    marginBottom: 16,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#003a63",
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e2e2",
  },
  colProduct: { flex: 3 },
  colSku: { flex: 2 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.4, textAlign: "right" },
  colTotal: { flex: 1.6, textAlign: "right" },
  totals: {
    alignSelf: "flex-end",
    width: 240,
    marginTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalRowBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#1a1c1c",
    marginTop: 4,
    fontWeight: "bold",
    fontSize: 11,
  },
  paymentBlock: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 3,
    fontSize: 9,
  },
  infoBlock: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 3,
    fontSize: 9,
  },
  trackList: {
    marginTop: 4,
  },
  trackRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    fontSize: 9,
  },
  mono: {
    fontFamily: "Courier",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    textAlign: "center",
    fontSize: 8,
    color: "#888",
    borderTopWidth: 1,
    borderTopColor: "#e2e2e2",
    paddingTop: 8,
  },
});

export interface SharedPdfLabels {
  companyName: string;
  companyTagline: string;
  footer: string;
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
  grandTotal: string;
}
