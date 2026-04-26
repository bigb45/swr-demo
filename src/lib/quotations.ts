/**
 * Quotation integration — ERP / Magento contract.
 *
 * =========================================================================
 * Backend spec (to implement on Magento + ERP before wiring the functions
 * below). The storefront ships the list and detail pages today but both
 * calls return empty results until these endpoints exist.
 * =========================================================================
 *
 * All endpoints require the signed-in customer token (same cookie used
 * for orders, `swr_customer_token`) and must enforce ownership server-
 * side — a customer must only see quotations where `customer_email`
 * matches their authenticated identity.
 *
 * ----------------------------------------------------------------------
 * 1) LIST
 *    GET /rest/V1/swr-quotations/mine
 *      ?status=open,accepted,expired   (optional, comma-separated)
 *      &pageSize=20&currentPage=1      (optional paging)
 *    Response:
 *      {
 *        "items": QuotationSummary[],
 *        "total_count": number
 *      }
 *    Each item matches the `QuotationSummary` interface below.
 *
 * ----------------------------------------------------------------------
 * 2) DETAIL
 *    GET /rest/V1/swr-quotations/mine/:id
 *    Response: `Quotation` (see interface below).
 *    Errors: 404 when id does not exist OR does not belong to the caller.
 *
 * ----------------------------------------------------------------------
 * 3) ACCEPT (price-locked add-to-cart)
 *    POST /rest/V1/swr-quotations/mine/:id/accept
 *    Request body: (none required — the endpoint reads the caller's
 *                   customer token)
 *    Behaviour:
 *      - Server loads the quotation and verifies ownership + status.
 *      - Server loads the customer's active cart (`carts/mine`), or
 *        creates one.
 *      - For each quotation line, server adds a cart item with a
 *        LOCKED unit price equal to the quotation's `unit_price`
 *        (via `custom_price`, negotiable-quote module, or an
 *        equivalent mechanism — the storefront does not care which,
 *        as long as checkout totals reflect quoted prices).
 *      - Server marks the quotation as `converted` so it cannot be
 *        accepted twice.
 *    Success response (200):
 *      { "success": true, "cartId": string }
 *    Errors:
 *      - 404: quotation not found or not owned
 *      - 409: already converted / rejected
 *      - 410: expired (past `valid_until`)
 *      - 422: one or more items are out of stock (body includes
 *             `unavailable_skus: string[]`)
 *
 *    Merge vs replace: ACCEPT **merges** into the active cart. It does
 *    NOT clear existing items. Product decision — the customer may hold
 *    unrelated items in their cart when accepting an offer; those
 *    survive. Duplicate SKUs between cart and quotation are summed.
 *
 * ----------------------------------------------------------------------
 * 4) PRICE LOCK
 *    Whatever mechanism the backend picks, the contract the frontend
 *    relies on is: once ACCEPT returns success, calling the standard
 *    Magento `carts/mine/totals` endpoint MUST reflect the quoted prices
 *    (i.e. grand_total matches `quotation.grand_total` assuming no other
 *    items and the same tax rules). The frontend performs no client-
 *    side price computation for quoted lines.
 *
 * =========================================================================
 */

const MAGENTO_BASE = process.env.MAGENTO_URL ?? "http://localhost:8000";

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

export interface AcceptQuotationSuccess {
  success: true;
  cartId: string;
}

export interface AcceptQuotationError {
  success: false;
  /** Maps onto `t(`accept.error.${code}`)` on the client. */
  code:
    | "not_found"
    | "already_converted"
    | "expired"
    | "out_of_stock"
    | "unknown";
  unavailable_skus?: string[];
  message?: string;
}

export type AcceptQuotationResult =
  | AcceptQuotationSuccess
  | AcceptQuotationError;

/**
 * List all quotations visible to the signed-in customer. Returns an empty
 * array while the backend endpoint is not yet available — the UI renders
 * its empty state. See contract note (1) above.
 */
export async function listCustomerQuotations(
  _email: string,
): Promise<QuotationSummary[]> {
  return [];
}

/**
 * Fetch a single quotation for the signed-in customer. Ownership is
 * enforced server-side (see contract note 2 above). Returns `null` while
 * the backend endpoint is not yet available.
 */
export async function getQuotationForCustomer(
  _id: string,
  _email: string,
): Promise<Quotation | null> {
  return null;
}

/**
 * Accept a quotation: server-side, lines are added to the customer's cart
 * with locked prices (see contract note 3). Returns a discriminated union
 * so the client can translate error codes into i18n keys.
 *
 * Today this throws if invoked because the endpoint is not yet wired. The
 * UI guards the button with a feature flag (`quotation.status === "open"`)
 * and catches errors defensively.
 */
export async function acceptQuotation(
  id: string,
  token: string,
): Promise<AcceptQuotationResult> {
  try {
    const res = await fetch(
      `${MAGENTO_BASE}/rest/V1/swr-quotations/mine/${encodeURIComponent(id)}/accept`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    const raw = await res.text();
    const body: unknown = raw.length > 0 ? safeJson(raw) : null;

    if (res.ok && body && typeof body === "object" && "success" in body) {
      return body as AcceptQuotationSuccess;
    }

    if (res.status === 404) return { success: false, code: "not_found" };
    if (res.status === 409) return { success: false, code: "already_converted" };
    if (res.status === 410) return { success: false, code: "expired" };
    if (res.status === 422) {
      const parsed = body as { unavailable_skus?: string[] } | null;
      return {
        success: false,
        code: "out_of_stock",
        unavailable_skus: parsed?.unavailable_skus,
      };
    }
    return {
      success: false,
      code: "unknown",
      message: `HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      success: false,
      code: "unknown",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
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
