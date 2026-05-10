/**
 * POST /api/cart/items  › add item to guest cart
 * Body: { cartId, sku, qty }
 */

import { NextRequest } from "next/server";
import { extractMagentoMessage } from "@/lib/checkout";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const { cartId, sku, qty } = await req.json();

  if (!cartId || !sku || !qty) {
    return Response.json(
      { error: "cartId, sku and qty required" },
      { status: 400 },
    );
  }

  const res = await fetch(`${MAGENTO}/rest/V1/guest-carts/${cartId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartItem: { sku, qty, quote_id: cartId } }),
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
