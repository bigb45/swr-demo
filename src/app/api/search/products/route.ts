/**
 * GET /api/search/products?q=&limit=
 *
 * Lightweight product list for header search suggestions (Magento admin REST).
 */

import type { NextRequest } from "next/server";
import { getFilteredProducts } from "@/lib/magento";
import type { MagentoProduct } from "@/types/magento";

const MIN_QUERY_LEN = 2;
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 12;
const CUSTOMER_COOKIE = "swr_customer_token";
const PRICE_ATTRIBUTE_PATTERN = /price|cost|amount|tier/i;

function sanitizeGuestProduct(product: MagentoProduct): Partial<MagentoProduct> {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    status: product.status,
    visibility: product.visibility,
    type_id: product.type_id,
    media_gallery_entries: product.media_gallery_entries,
    custom_attributes: product.custom_attributes?.filter(
      (attr) => !PRICE_ATTRIBUTE_PATTERN.test(attr.attribute_code),
    ),
    extension_attributes: product.extension_attributes
      ? {
          stock_item: product.extension_attributes.stock_item,
          salable_quantity: product.extension_attributes.salable_quantity,
        }
      : undefined,
  };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limitParam = req.nextUrl.searchParams.get("limit");
  let limit = DEFAULT_LIMIT;
  if (limitParam) {
    const n = Number.parseInt(limitParam, 10);
    if (Number.isFinite(n) && n > 0) {
      limit = Math.min(n, MAX_LIMIT);
    }
  }

  if (q.length < MIN_QUERY_LEN) {
    return Response.json({ items: [] });
  }

  try {
    const list = await getFilteredProducts(1, limit, { q });
    const isAuthenticated = !!req.cookies.get(CUSTOMER_COOKIE)?.value;
    const items = isAuthenticated
      ? list.items ?? []
      : (list.items ?? []).map(sanitizeGuestProduct);
    return Response.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ items: [], error: message }, { status: 503 });
  }
}
