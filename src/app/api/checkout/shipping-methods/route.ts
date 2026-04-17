/**
 * POST /api/checkout/shipping-methods
 * Body: { cartId: string, address: MagentoCheckoutAddress }
 * Response: { methods: MagentoShippingMethod[] }
 *
 * Asks Magento which shipping methods are available for the given address +
 * cart contents. Used by /checkout/shipping. Auth-gated (signed-in only).
 */

import { NextRequest } from "next/server";
import {
  estimateShippingMethods,
  extractMagentoMessage,
  getAdminToken,
  getCustomerToken,
} from "@/lib/checkout";
import type { MagentoCheckoutAddress } from "@/types/magento";

export async function POST(req: NextRequest) {
  const token = await getCustomerToken();
  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { cartId, address } = (await req.json()) as {
    cartId?: string;
    address?: MagentoCheckoutAddress;
  };

  if (!cartId || typeof cartId !== "string") {
    return Response.json({ error: "cartId required" }, { status: 400 });
  }
  if (!address || typeof address !== "object") {
    return Response.json({ error: "address required" }, { status: 400 });
  }

  let adminToken: string;
  try {
    adminToken = await getAdminToken();
  } catch {
    return Response.json({ error: "Backend unavailable" }, { status: 502 });
  }

  const result = await estimateShippingMethods(cartId, adminToken, address);
  if (!result.ok || !Array.isArray(result.data)) {
    return Response.json(
      {
        error: extractMagentoMessage(
          result.data,
          "Failed to fetch shipping methods",
        ),
      },
      { status: result.status || 502 },
    );
  }

  return Response.json({ methods: result.data });
}
