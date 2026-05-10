/**
 * Checkout helpers shared by the API routes and the /checkout server
 * components. Encapsulates:
 *
 * - the short-lived `swr_checkout_state` cookie that holds the address the
 *   customer picked in step 1 (so steps 2 and 3 can read it without
 *   re-prompting), and
 * - thin wrappers around the Magento REST endpoints checkout uses
 *   (`/customers/me`, `/guest-carts/:id`, `/guest-carts/:id/totals`,
 *   `/.../estimate-shipping-methods`, `/.../shipping-information`).
 *
 * The cookie is httpOnly, scoped to the entire site, and limited to one hour
 * to match the customer-token cookie lifetime. It is cleared after a
 * successful order (in `/api/cart/order`) and on explicit cancellation.
 */

import { cookies } from "next/headers";
import { getProductBySku } from "@/lib/magento";
import { getStockStatus } from "@/lib/stock";
import type {
  MagentoCheckoutAddress,
  MagentoCustomerMe,
  MagentoPaymentMethod,
  MagentoShippingMethod,
  MagentoShippingInformationResult,
} from "@/types/magento";

export const CUSTOMER_TOKEN_COOKIE = "swr_customer_token";
export const CHECKOUT_STATE_COOKIE = "swr_checkout_state";
const CHECKOUT_STATE_MAX_AGE = 60 * 60; // 1 hour

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";

/* ----------------------------- Cookie state ----------------------------- */

export interface CheckoutState {
  cartId: string;
  address: MagentoCheckoutAddress;
  /** Source address book id, when the user picked a saved address. */
  addressId?: number;
  /**
   * Payment methods returned by Magento from `shipping-information`. Captured
   * at the end of step 2 so step 3 can render the selection without another
   * round-trip.
   */
  paymentMethods?: MagentoPaymentMethod[];
}

export async function readCheckoutState(): Promise<CheckoutState | null> {
  const store = await cookies();
  const raw = store.get(CHECKOUT_STATE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CheckoutState;
    if (
      typeof parsed?.cartId === "string" &&
      parsed?.address &&
      typeof parsed.address === "object"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function writeCheckoutState(state: CheckoutState): Promise<void> {
  const store = await cookies();
  store.set(CHECKOUT_STATE_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CHECKOUT_STATE_MAX_AGE,
  });
}

export async function clearCheckoutState(): Promise<void> {
  const store = await cookies();
  store.delete(CHECKOUT_STATE_COOKIE);
}

export async function getCustomerToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CUSTOMER_TOKEN_COOKIE)?.value ?? null;
}

/* ----------------------------- Magento calls ---------------------------- */

interface MagentoCallResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
}

async function callMagento<T = unknown>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  token: string,
  body?: unknown,
): Promise<MagentoCallResult<T>> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const raw = await res.text();
  let data: T | null = null;
  try {
    data = raw.length > 0 ? (JSON.parse(raw) as T) : null;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

/**
 * Acquires (and caches in module scope for the request lifetime) a Magento
 * admin token. Used for cart-side endpoints, which require an authenticated
 * caller — even guest cart operations.
 */
let cachedAdminToken: { token: string; expires: number } | null = null;

export async function getAdminToken(): Promise<string> {
  const now = Date.now();
  if (cachedAdminToken && cachedAdminToken.expires > now) {
    return cachedAdminToken.token;
  }
  const res = await fetch(`${MAGENTO}/rest/V1/integration/admin/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.MAGENTO_ADMIN_USER,
      password: process.env.MAGENTO_ADMIN_PASSWORD,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to obtain admin token");
  const token: string = await res.json();
  cachedAdminToken = { token, expires: now + 1000 * 60 * 30 };
  return token;
}

/**
 * Magento REST errors come back as
 *   { message: "\"%fieldName\" is required.", parameters: { fieldName: "sku" } }
 * or with positional placeholders
 *   { message: "Invalid value \"%1\" for %2.", parameters: ["foo", "name"] }
 * Forwarding `message` raw leaks the literal `%fieldName` / `%1` to the UI, so
 * we substitute the placeholders before surfacing the string.
 */
export function extractMagentoMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;

  const obj = data as { message?: unknown; parameters?: unknown };
  const message = obj.message;
  if (typeof message !== "string" || message.length === 0) return fallback;

  return interpolateMagentoMessage(message, obj.parameters);
}

function interpolateMagentoMessage(
  message: string,
  parameters: unknown,
): string {
  if (!parameters) return message;

  if (Array.isArray(parameters)) {
    return message.replace(/%(\d+)/g, (match, idx) => {
      const value = parameters[Number(idx) - 1];
      return value === undefined || value === null ? match : String(value);
    });
  }

  if (typeof parameters === "object") {
    const params = parameters as Record<string, unknown>;
    return message.replace(/%([A-Za-z_][A-Za-z0-9_]*)/g, (match, key) => {
      const value = params[key];
      return value === undefined || value === null ? match : String(value);
    });
  }

  return message;
}

export async function fetchCustomerMe(
  customerToken: string,
): Promise<MagentoCustomerMe | null> {
  const res = await callMagento<MagentoCustomerMe>(
    `${MAGENTO}/rest/V1/customers/me`,
    "GET",
    customerToken,
  );
  if (!res.ok || !res.data || typeof res.data.email !== "string") return null;
  return res.data;
}

export async function updateCustomerMe(
  customerToken: string,
  customer: MagentoCustomerMe,
): Promise<MagentoCallResult<MagentoCustomerMe>> {
  return callMagento<MagentoCustomerMe>(
    `${MAGENTO}/rest/V1/customers/me`,
    "PUT",
    customerToken,
    { customer },
  );
}

export async function deleteCustomerAddress(
  adminToken: string,
  addressId: number,
): Promise<MagentoCallResult> {
  return callMagento(
    `${MAGENTO}/rest/V1/addresses/${addressId}`,
    "DELETE",
    adminToken,
  );
}

interface GuestCartInfo {
  id: number;
  store_id?: number;
  is_active: boolean;
  items_count?: number;
  items?: Array<{ item_id: number; sku: string }>;
}

export async function fetchGuestCart(
  cartId: string,
  adminToken: string,
): Promise<GuestCartInfo | null> {
  const res = await callMagento<GuestCartInfo>(
    `${MAGENTO}/rest/V1/guest-carts/${cartId}`,
    "GET",
    adminToken,
  );
  if (!res.ok || !res.data) return null;
  return res.data;
}

export interface GuestCartTotalsResponse {
  grand_total: number;
  base_grand_total?: number;
  subtotal: number;
  subtotal_with_discount?: number;
  tax_amount: number;
  shipping_amount?: number;
  discount_amount?: number;
  shipping_incl_tax?: number;
  quote_currency_code?: string;
  items?: Array<{
    item_id: number;
    name?: string;
    qty: number;
    price?: number;
    row_total?: number;
    row_total_incl_tax?: number;
  }>;
  total_segments?: Array<{
    code: string;
    title: string;
    value: number;
  }>;
}

export async function fetchGuestCartTotals(
  cartId: string,
): Promise<GuestCartTotalsResponse | null> {
  const res = await fetch(`${MAGENTO}/rest/V1/guest-carts/${cartId}/totals`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as GuestCartTotalsResponse;
}

/** Line payload from `GET /V1/guest-carts/:cartId/items` (unauthenticated). */
export interface GuestCartLineItem {
  item_id: number;
  sku: string;
  qty: number;
  product_type?: string;
  parent_item_id?: number;
}

export async function fetchGuestCartLineItems(
  cartId: string,
): Promise<GuestCartLineItem[] | null> {
  const res = await fetch(`${MAGENTO}/rest/V1/guest-carts/${cartId}/items`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data: unknown = await res.json();
  if (!Array.isArray(data)) return null;
  return data as GuestCartLineItem[];
}

/**
 * Best-effort salable check using the same product payload + rules as PDP/cart.
 * Skips configurable parent rows (children carry the simple SKU + qty).
 */
export async function assertGuestCartLinesSalable(
  lines: GuestCartLineItem[],
): Promise<
  { ok: true; skuEntries: number } | { ok: false; reason: "empty" | "stock"; sku?: string }
> {
  if (lines.length === 0) return { ok: false, reason: "empty" };

  const totalsBySku = new Map<string, number>();
  for (const item of lines) {
    if (item.product_type === "configurable" && item.parent_item_id == null) {
      continue;
    }
    const q = Number(item.qty);
    if (!Number.isFinite(q) || q <= 0) continue;
    totalsBySku.set(item.sku, (totalsBySku.get(item.sku) ?? 0) + q);
  }

  if (totalsBySku.size === 0) return { ok: false, reason: "empty" };

  for (const [sku, needQty] of totalsBySku) {
    try {
      const product = await getProductBySku(sku);
      const st = getStockStatus(product);
      if (st.level === "out") {
        return { ok: false, reason: "stock", sku };
      }
      if (typeof st.qty === "number" && needQty > st.qty) {
        return { ok: false, reason: "stock", sku };
      }
    } catch {
      /* If the catalog read fails, defer to Magento place-order validation. */
    }
  }

  return { ok: true, skuEntries: totalsBySku.size };
}

export async function estimateShippingMethods(
  cartId: string,
  adminToken: string,
  address: MagentoCheckoutAddress,
): Promise<MagentoCallResult<MagentoShippingMethod[]>> {
  return callMagento<MagentoShippingMethod[]>(
    `${MAGENTO}/rest/V1/guest-carts/${cartId}/estimate-shipping-methods`,
    "POST",
    adminToken,
    { address },
  );
}

export async function setShippingInformation(
  cartId: string,
  adminToken: string,
  payload: {
    address: MagentoCheckoutAddress;
    shippingCarrierCode: string;
    shippingMethodCode: string;
  },
): Promise<MagentoCallResult<MagentoShippingInformationResult>> {
  // Guest masked quotes do not accept customer_address_id until the customer is
  // assigned (we assign in placeOrderAction). Send the full inline address only.
  const { customer_address_id: _guestQuoteOmitAddressId, ...addressBody } =
    payload.address;

  return callMagento<MagentoShippingInformationResult>(
    `${MAGENTO}/rest/V1/guest-carts/${cartId}/shipping-information`,
    "POST",
    adminToken,
    {
      addressInformation: {
        shipping_address: addressBody,
        billing_address: addressBody,
        shipping_carrier_code: payload.shippingCarrierCode,
        shipping_method_code: payload.shippingMethodCode,
      },
    },
  );
}

export async function assignCustomerToCart(
  numericCartId: number,
  adminToken: string,
  customerId: number,
  storeId: number,
): Promise<MagentoCallResult> {
  return callMagento(
    `${MAGENTO}/rest/V1/carts/${numericCartId}`,
    "PUT",
    adminToken,
    { customerId, storeId },
  );
}

export async function placeCustomerOrder(
  numericCartId: number,
  adminToken: string,
  paymentMethod: { method: string; po_number?: string },
): Promise<MagentoCallResult<number>> {
  return callMagento<number>(
    `${MAGENTO}/rest/V1/carts/${numericCartId}/order`,
    "PUT",
    adminToken,
    { paymentMethod },
  );
}
