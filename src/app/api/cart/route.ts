/**
 * POST /api/cart  → create a new Magento guest cart, returns { cartId }
 * GET  /api/cart?cartId=xxx → fetch cart items + totals
 */

import { NextRequest } from "next/server";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";

export async function POST() {
  const res = await fetch(`${MAGENTO}/rest/V1/guest-carts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    return Response.json({ error: "Failed to create cart" }, { status: 502 });
  }

  const cartId: string = await res.json();
  return Response.json({ cartId });
}

export async function GET(req: NextRequest) {
  const cartId = req.nextUrl.searchParams.get("cartId");
  if (!cartId) {
    return Response.json({ error: "cartId required" }, { status: 400 });
  }

  const [itemsRes, totalsRes] = await Promise.all([
    fetch(`${MAGENTO}/rest/V1/guest-carts/${cartId}/items`, { cache: "no-store" }),
    fetch(`${MAGENTO}/rest/V1/guest-carts/${cartId}/totals`, { cache: "no-store" }),
  ]);

  if (!itemsRes.ok || !totalsRes.ok) {
    return Response.json({ error: "Failed to fetch cart" }, { status: 502 });
  }

  const [items, totals] = await Promise.all([itemsRes.json(), totalsRes.json()]);
  return Response.json({ items, totals });
}
