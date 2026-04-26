/**
 * POST /api/cart  → create a new Magento guest cart, returns { cartId }
 * GET  /api/cart?cartId=xxx → fetch cart items + totals
 */

import { NextRequest } from "next/server";
import { getProductBySku } from "@/lib/magento";
import { getProductImageUrl } from "@/lib/magento-shared";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";

interface MagentoCartItem {
  item_id: number;
  sku: string;
  qty: number;
  name: string;
  price: number;
  product_type: string;
  quote_id: string;
}

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
    // Pass Magento's 404 through so the client can drop a stale cart id; only
    // map non-4xx upstream failures to 502.
    const upstream = !itemsRes.ok ? itemsRes.status : totalsRes.status;
    const status = upstream >= 400 && upstream < 500 ? upstream : 502;
    return Response.json({ error: "Failed to fetch cart" }, { status });
  }

  const [items, totals] = await Promise.all([
    itemsRes.json() as Promise<MagentoCartItem[]>,
    totalsRes.json(),
  ]);

  const productsBySku = new Map(
    await Promise.all(
      [...new Set(items.map((item) => item.sku))].map(async (sku) => {
        try {
          const product = await getProductBySku(sku);
          return [sku, getProductImageUrl(product)] as const;
        } catch {
          return [sku, null] as const;
        }
      })
    )
  );

  const itemsWithImages = items.map((item) => ({
    ...item,
    imageUrl: productsBySku.get(item.sku) ?? null,
  }));
  return Response.json({ items: itemsWithImages, totals });
}
