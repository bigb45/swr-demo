/**
 * POST /api/checkout/shipping-information
 * Body: {
 *   cartId: string,
 *   address: MagentoCheckoutAddress,
 *   shippingCarrierCode: string,
 *   shippingMethodCode: string,
 * }
 *
 * Persists the chosen address + shipping method onto the (still-guest) cart.
 * Magento returns the available payment methods and the recomputed totals;
 * we forward both to the caller so step 3 can render them without an extra
 * round-trip.
 */

import { NextRequest } from "next/server";
import {
  extractMagentoMessage,
  getAdminToken,
  getCustomerToken,
  setShippingInformation,
} from "@/lib/checkout";
import type { MagentoCheckoutAddress } from "@/types/magento";

export async function POST(req: NextRequest) {
  const token = await getCustomerToken();
  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await req.json()) as {
    cartId?: string;
    address?: MagentoCheckoutAddress;
    shippingCarrierCode?: string;
    shippingMethodCode?: string;
  };

  if (!body.cartId || typeof body.cartId !== "string") {
    return Response.json({ error: "cartId required" }, { status: 400 });
  }
  if (!body.address) {
    return Response.json({ error: "address required" }, { status: 400 });
  }
  if (!body.shippingCarrierCode || !body.shippingMethodCode) {
    return Response.json(
      { error: "shipping method required" },
      { status: 400 },
    );
  }

  let adminToken: string;
  try {
    adminToken = await getAdminToken();
  } catch {
    return Response.json({ error: "Backend unavailable" }, { status: 502 });
  }

  const result = await setShippingInformation(body.cartId, adminToken, {
    address: body.address,
    shippingCarrierCode: body.shippingCarrierCode,
    shippingMethodCode: body.shippingMethodCode,
  });

  if (!result.ok || !result.data) {
    return Response.json(
      {
        error: extractMagentoMessage(
          result.data,
          "Failed to save shipping information",
        ),
      },
      { status: result.status || 502 },
    );
  }

  return Response.json({
    paymentMethods: result.data.payment_methods,
    totals: result.data.totals,
  });
}
