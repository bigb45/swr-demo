/**
 * GET /api/categories/top-level?locale=de
 *
 * Returns the shop mega-menu top-level categories as ready-to-render
 * `ShopCategoryNavItem[]`. Kept off the header's server render path so the
 * header never blocks on Magento — the nav loads this lazily on first open.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTopLevelCategories } from "@/lib/magento";
import { LOCALE_STORE_CODES } from "@/lib/magento-shared";
import { toShopCategoryNavItems } from "@/lib/shop-categories";

export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get("locale") ?? "de";
  const storeCode = LOCALE_STORE_CODES[localeParam];

  const categories = await getTopLevelCategories(storeCode).catch(() => []);
  const items = toShopCategoryNavItems(categories, 8);

  return NextResponse.json(items, {
    headers: {
      // Underlying Magento fetches are already cached (revalidate 300); this
      // lets the browser reuse the response across navigations too.
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
