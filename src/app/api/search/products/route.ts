/**
 * GET /api/search/products?q=&limit=
 *
 * Lightweight product list for header search suggestions (Magento admin REST).
 */

import type { NextRequest } from "next/server";
import { getFilteredProducts } from "@/lib/magento";

const MIN_QUERY_LEN = 2;
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 12;

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
    return Response.json({ items: list.items ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ items: [], error: message }, { status: 503 });
  }
}
