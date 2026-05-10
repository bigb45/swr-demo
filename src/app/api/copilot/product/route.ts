/**
 * GET /api/copilot/product?sku=
 *
 * Lightweight product projection for Copilot widgets (Magento admin REST, server-only).
 */

import type { NextRequest } from "next/server";
import { resolveMagentoProductBySkuFlexible } from "@/lib/magento";
import { getProductImageUrl } from "@/lib/magento-shared";
import { getStockStatus } from "@/lib/stock";

export async function GET(req: NextRequest) {
  const sku = req.nextUrl.searchParams.get("sku")?.trim();
  if (!sku) {
    return Response.json({ error: "sku is required" }, { status: 400 });
  }

  const product = await resolveMagentoProductBySkuFlexible(sku);
  if (!product) {
    return Response.json(
      {
        error: "not_found",
        sku: sku.trim(),
      },
      { status: 404 },
    );
  }

  const stock = getStockStatus(product);

  return Response.json(
    {
      sku: product.sku,
      name: product.name,
      price: product.price,
      imageUrl: getProductImageUrl(product),
      stockLevel: stock.level,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
