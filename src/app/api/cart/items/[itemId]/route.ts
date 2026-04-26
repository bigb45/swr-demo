/**
 * PUT    /api/cart/items/[itemId]  → update item qty
 * DELETE /api/cart/items/[itemId]  → remove item
 * Body (PUT): { cartId, sku, qty }
 * Body (DELETE): { cartId }
 */

import { NextRequest } from "next/server";
import { extractMagentoMessage } from "@/lib/checkout";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";

type Ctx = { params: Promise<{ itemId: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { itemId } = await ctx.params;
  const { cartId, sku, qty } = await req.json();

  const res = await fetch(`${MAGENTO}/rest/V1/guest-carts/${cartId}/items/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartItem: { item_id: Number(itemId), sku, qty, quote_id: cartId } }),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    return Response.json(
      { error: extractMagentoMessage(data, "Failed to update item") },
      { status: res.status },
    );
  }
  return Response.json(data);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { itemId } = await ctx.params;
  const { cartId } = await req.json();

  const res = await fetch(`${MAGENTO}/rest/V1/guest-carts/${cartId}/items/${itemId}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return Response.json(
      { error: extractMagentoMessage(data, "Failed to remove item") },
      { status: res.status },
    );
  }

  return Response.json({ success: true });
}
