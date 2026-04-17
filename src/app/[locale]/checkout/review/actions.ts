"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  assignCustomerToCart,
  clearCheckoutState,
  extractMagentoMessage,
  fetchCustomerMe,
  fetchGuestCart,
  getAdminToken,
  placeCustomerOrder,
} from "@/lib/checkout";

export interface PlaceOrderArgs {
  locale: string;
  poNumber?: string;
}

export async function placeOrderAction(
  args: PlaceOrderArgs,
): Promise<{ ok: false; error: string } | never> {
  const cookieStore = await cookies();
  const customerToken = cookieStore.get("swr_customer_token")?.value;
  const cartId = cookieStore.get("swr_cart_id")?.value;

  if (!customerToken) return { ok: false, error: "Not authenticated" };
  if (!cartId) return { ok: false, error: "No active cart" };

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

  const orderRes = await placeCustomerOrder(cart.id, adminToken, {
    method: "checkmo",
    ...(trimmedPo ? { po_number: trimmedPo } : {}),
  });

  if (!orderRes.ok || typeof orderRes.data !== "number") {
    return {
      ok: false,
      error: extractMagentoMessage(orderRes.data, "Failed to place order"),
    };
  }

  // Clear cart + checkout state cookies so the user starts clean next time.
  await clearCheckoutState();
  cookieStore.delete("swr_cart_id");

  redirect(`/${args.locale}/orders/${orderRes.data}`);
}
