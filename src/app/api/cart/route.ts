/**
 * POST /api/cart  › create a new Magento guest cart, returns { cartId }
 * GET  /api/cart?cartId=xxx › fetch cart items + totals
 *
 * Signed-in shoppers with an enventa customer id get ERP net prices overlaid
 * on Magento quote lines (Magento catalog/quote amounts are often 0).
 */

import { NextRequest } from "next/server";
import {
  applyErpPricingToCartDisplay,
  resolveEnventaCustomerId,
} from "@/lib/erp";
import { getProductBySku } from "@/lib/magento";
import { getProductImageUrl } from "@/lib/magento-shared";
import { resolveSelectedOptionLabels } from "@/lib/custom-options";
import type { MagentoCustomOptionSelection } from "@/types/magento";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";
const CUSTOMER_COOKIE = "swr_customer_token";

function stripGuestPrices<T extends Record<string, unknown>>(totals: T): T {
  const zeroed: Record<string, unknown> = { ...totals };
  for (const key of Object.keys(zeroed)) {
    if (typeof zeroed[key] === "number") {
      zeroed[key] = 0;
    }
  }
  return zeroed as T;
}

interface MagentoCartItem {
  item_id: number;
  sku: string;
  qty: number;
  name: string;
  price: number;
  product_type: string;
  quote_id: string;
  product_option?: {
    extension_attributes?: {
      custom_options?: MagentoCustomOptionSelection[];
    };
  };
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
    fetch(`${MAGENTO}/rest/V1/guest-carts/${cartId}/items`, {
      cache: "no-store",
    }),
    fetch(`${MAGENTO}/rest/V1/guest-carts/${cartId}/totals`, {
      cache: "no-store",
    }),
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
    totalsRes.json() as Promise<Record<string, unknown>>,
  ]);

  const productsBySku = new Map(
    await Promise.all(
      [...new Set(items.map((item) => item.sku))].map(async (sku) => {
        try {
          const product = await getProductBySku(sku);
          return [sku, product] as const;
        } catch {
          return [sku, null] as const;
        }
      }),
    ),
  );

  const itemsWithImages = items.map((item) => {
    const product = productsBySku.get(item.sku) ?? null;
    const customOptions =
      item.product_option?.extension_attributes?.custom_options;
    return {
      ...item,
      imageUrl: product ? getProductImageUrl(product) : null,
      selectedOptions: resolveSelectedOptionLabels(
        customOptions,
        product?.options,
      ),
    };
  });

  const isAuthenticated = !!req.cookies.get(CUSTOMER_COOKIE)?.value;
  if (!isAuthenticated) {
    return Response.json({
      items: itemsWithImages.map(({ price: _price, ...item }) => ({
        ...item,
        price: 0,
        priceHidden: true,
      })),
      totals: stripGuestPrices(totals),
    });
  }

  const enventaId = await resolveEnventaCustomerId();
  const priced = await applyErpPricingToCartDisplay(
    itemsWithImages,
    totals as {
      subtotal?: number;
      subtotal_with_discount?: number;
      tax_amount?: number;
      shipping_amount?: number;
      grand_total?: number;
      items?: Array<{
        item_id: number;
        price?: number;
        row_total?: number;
        row_total_incl_tax?: number;
        qty?: number;
      }>;
    },
    enventaId,
  );

  return Response.json(
    { items: priced.items, totals: priced.totals },
    { headers: { "Cache-Control": "no-store" } },
  );
}
