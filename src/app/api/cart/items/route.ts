/**
 * POST /api/cart/items  › add item to guest cart
 * Body: { cartId, sku, qty, customOptions? }
 */

import { NextRequest } from "next/server";
import { extractMagentoMessage } from "@/lib/checkout";
import type { MagentoCustomOptionSelection } from "@/types/magento";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const { cartId, sku, qty, customOptions } = (await req.json()) as {
    cartId?: string;
    sku?: string;
    qty?: number;
    customOptions?: MagentoCustomOptionSelection[];
  };

  if (!cartId || !sku || !qty) {
    return Response.json(
      { error: "cartId, sku and qty required" },
      { status: 400 },
    );
  }

  const cartItem: Record<string, unknown> = { sku, qty, quote_id: cartId };
  if (customOptions && customOptions.length > 0) {
    cartItem.product_option = {
      extension_attributes: { custom_options: customOptions },
    };
  }

  const res = await fetch(`${MAGENTO}/rest/V1/guest-carts/${cartId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartItem }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    return Response.json(
      { error: extractMagentoMessage(data, "Failed to add item") },
      { status: res.status },
    );
  }

  return Response.json(data);
}
