/**
 * Quotation lookup — ERP integration hook.
 *
 * Today this module intentionally returns empty results. When the Magento /
 * ERP backend exposes quotations via a custom endpoint (expected shape:
 * `GET /rest/V1/swr-quotations?searchCriteria[...]`), wire the two
 * functions below. Consumers (the `/account/quotations` pages) will not
 * need to change.
 */

export type QuotationStatus =
  | "open"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted";

export interface QuotationLineItem {
  sku: string;
  name: string;
  qty: number;
  unit_price: number;
  row_total: number;
}

export interface QuotationSummary {
  id: string;
  number: string;
  created_at: string;
  valid_until?: string;
  status: QuotationStatus;
  currency: string;
  grand_total: number;
}

export interface Quotation extends QuotationSummary {
  items: QuotationLineItem[];
  subtotal: number;
  tax_amount: number;
  customer_email: string;
  notes?: string;
}

/**
 * List all quotations visible to the signed-in customer. Returns an empty
 * array when no endpoint is wired — the UI renders its empty state.
 */
export async function listCustomerQuotations(
  _email: string,
): Promise<QuotationSummary[]> {
  // TODO(erp): wire to the ERP-backed Magento endpoint. Expected shape:
  //   GET /rest/V1/swr-quotations?searchCriteria[...customer_email...]
  //   -> { items: QuotationSummary[], total_count }
  return [];
}

/**
 * Fetch a single quotation for the signed-in customer. Must verify the
 * quotation's `customer_email` matches before returning.
 */
export async function getQuotationForCustomer(
  _id: string,
  _email: string,
): Promise<Quotation | null> {
  // TODO(erp): wire to GET /rest/V1/swr-quotations/:id and verify ownership
  // by comparing `customer_email` against the signed-in customer, mirroring
  // the pattern in `getOrderForCustomer`.
  return null;
}

/* ----------------------- UI helpers (shared) ----------------------- */

export function quotationStatusTone(status: QuotationStatus): string {
  switch (status) {
    case "accepted":
    case "converted":
      return "bg-secondary/10 text-secondary";
    case "open":
      return "bg-primary/10 text-primary";
    case "expired":
      return "bg-amber-100 text-amber-800";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-surface-container-low text-on-surface-variant";
  }
}
