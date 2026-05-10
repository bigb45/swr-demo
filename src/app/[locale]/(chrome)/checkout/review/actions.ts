"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  assertGuestCartLinesSalable,
  assignCustomerToCart,
  clearCheckoutState,
  extractMagentoMessage,
  fetchCustomerMe,
  fetchGuestCart,
  fetchGuestCartLineItems,
  getAdminToken,
  placeCustomerOrder,
} from "@/lib/checkout";

export interface PlaceOrderArgs {
  locale: string;
  /**
   * Magento payment-method code, one of the values returned by Magento on the
   * `shipping-information` call (e.g. `checkmo`, `banktransfer`, `purchaseorder`).
   * Falls back to `checkmo` if omitted — the only method reliably available
   * in a vanilla Magento install.
   */
  paymentMethod?: string;
  poNumber?: string;
}

export async function placeOrderAction(
  args: PlaceOrderArgs,
): Promise<{ ok: false; error: string } | never> {
  const t = await getTranslations({ locale: args.locale, namespace: "checkout" });
  const cookieStore = await cookies();
  const customerToken = cookieStore.get("swr_customer_token")?.value;
  const cartId = cookieStore.get("swr_cart_id")?.value;

  if (!customerToken) return { ok: false, error: "Not authenticated" };
  if (!cartId) return { ok: false, error: "No active cart" };

  const lines = await fetchGuestCartLineItems(cartId);

  if (!lines) {
    return { ok: false, error: t("cartLinesLoadFailed") };
  }

  const salable = await assertGuestCartLinesSalable(lines);
  if (!salable.ok) {
    if (salable.reason === "stock" && salable.sku) {
      return { ok: false, error: t("insufficientStockLine", { sku: salable.sku }) };
    }
    return { ok: false, error: t("cartHasNoItemsForOrder") };
  }

  const trimmedPo =
    typeof args.poNumber === "string" && args.poNumber.trim().length > 0
      ? args.poNumber.trim()
      : undefined;

  const customer = await fetchCustomerMe(customerToken);
  if (!customer) {
    return { ok: false, error: "Session expired" };
  }

  let adminToken: string;
  try {
    adminToken = await getAdminToken();
  } catch {
    return { ok: false, error: "Backend unavailable" };
  }

  const cart = await fetchGuestCart(cartId, adminToken);
  if (!cart) {
    return { ok: false, error: "Cart no longer exists" };
  }

  const storeId = cart.store_id ?? customer.store_id ?? 1;
  const assign = await assignCustomerToCart(
    cart.id,
    adminToken,
    customer.id,
    storeId,
  );
  if (!assign.ok) {
    const msg = extractMagentoMessage(assign.data, "");
    const alreadyAssigned =
      assign.status === 400 &&
      msg.toLowerCase().includes("customer is already assigned");
    if (!alreadyAssigned) {
      return {
        ok: false,
        error: extractMagentoMessage(
          assign.data,
          "Failed to assign customer to cart",
        ),
      };
    }
  }

  const method =
    typeof args.paymentMethod === "string" &&
    args.paymentMethod.trim().length > 0
      ? args.paymentMethod.trim()
      : "checkmo";

  const orderRes = await placeCustomerOrder(cart.id, adminToken, {
    method,
    ...(trimmedPo ? { po_number: trimmedPo } : {}),
  });

  if (!orderRes.ok || typeof orderRes.data !== "number") {
    const raw = extractMagentoMessage(orderRes.data, t("orderPlaceFailed"));
    const low = raw.toLowerCase();

    if (
      low.includes("not enough items") ||
      low.includes("not enough salable") ||
      low.includes("insufficient quantity")
    ) {
      return { ok: false, error: t("insufficientStockGeneric") };
    }
    return { ok: false, error: raw };
  }

  // Clear cart + checkout state cookies so the user starts clean next time.
  await clearCheckoutState();
  cookieStore.delete("swr_cart_id");

  redirect(`/${args.locale}/orders/${orderRes.data}`);
}
