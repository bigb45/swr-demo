/**
 * POST /api/cart/order
 * Body: { cartId, poNumber? }
 *
 * Places a Magento order from the signed-in customer's cart. The cart must
 * already have shipping-information set on it (handled by step 2 of the
 * /checkout flow). This route only:
 *
 *   1. Verifies the request has a `swr_customer_token` cookie.
 *   2. Resolves the numeric cart id from the masked guest-cart id.
 *   3. Assigns the cart to the customer (`PUT /V1/carts/:numeric`).
 *   4. Places the order (`PUT /V1/carts/:numeric/order`).
 *
 * Guest checkout has been removed (the user requested signed-in only).
 *
 * Returns { orderId } on success.
 */

import { NextRequest } from "next/server";
import {
  assignCustomerToCart,
  extractMagentoMessage,
  fetchCustomerMe,
  fetchGuestCart,
  getAdminToken,
  getCustomerToken,
  placeCustomerOrder,
} from "@/lib/checkout";

export async function POST(req: NextRequest) {
  const { cartId, poNumber } = await req.json();
  if (!cartId || typeof cartId !== "string") {
    return Response.json({ error: "cartId required" }, { status: 400 });
  }

  const customerToken = await getCustomerToken();
  if (!customerToken) {
    return Response.json(
      { error: "You must be signed in to place an order." },
      { status: 401 },
    );
  }

  const trimmedPo =
    typeof poNumber === "string" && poNumber.trim().length > 0
      ? poNumber.trim()
      : undefined;

  const customer = await fetchCustomerMe(customerToken);
  if (!customer) {
    return Response.json(
      { error: "Your session has expired. Please sign in again." },
      { status: 401 },
    );
  }

  let adminToken: string;
  try {
    adminToken = await getAdminToken();
  } catch {
    return Response.json({ error: "Authentication error" }, { status: 502 });
  }

  const cart = await fetchGuestCart(cartId, adminToken);
  if (!cart) {
    return Response.json(
      { error: "Cart no longer exists. Please add items again." },
      { status: 404 },
    );
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
      return Response.json(
        {
          error: extractMagentoMessage(
            assign.data,
            "Failed to assign customer to cart",
          ),
        },
        { status: assign.status },
      );
    }
  }

  const orderRes = await placeCustomerOrder(cart.id, adminToken, {
    method: "checkmo",
    ...(trimmedPo ? { po_number: trimmedPo } : {}),
  });

  if (!orderRes.ok || typeof orderRes.data !== "number") {
    return Response.json(
      {
        error: extractMagentoMessage(orderRes.data, "Failed to place order"),
      },
      { status: orderRes.status || 502 },
    );
  }

  return Response.json({ orderId: orderRes.data });
}
