/**
 * GET /api/copilot/product?sku=
 *
 * Lightweight product projection for Copilot widgets (Magento admin REST, server-only).
 * When the shopper is logged in and has an enventa_customer_id, also attaches
 * ERP contract price/stock from unified_catalog_data (fail-safe nulls).
 */

import type { NextRequest } from "next/server";
import { getSupportedOptions } from "@/lib/custom-options";
import { fetchCustomerMe, getCustomerToken } from "@/lib/checkout";
import {
  fetchEnventaCustomerId,
  fetchErpDataForSku,
  resolveMagentoProductBySkuFlexible,
  type ErpSkuData,
} from "@/lib/magento";
import { getProductImageUrl } from "@/lib/magento-shared";
import { getStockStatus } from "@/lib/stock";

async function resolveErpForSession(sku: string): Promise<ErpSkuData | null> {
  try {
    const token = await getCustomerToken();
    if (!token) return null;
    const me = await fetchCustomerMe(token);
    if (me?.id == null) return null;
    const enventaId = await fetchEnventaCustomerId(me.id);
    if (!enventaId) return null;
    return fetchErpDataForSku(sku, enventaId);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const sku = req.nextUrl.searchParams.get("sku")?.trim();
  if (!sku) {
    return Response.json({ error: "sku is required" }, { status: 400 });
  }

  const [product, erp] = await Promise.all([
    resolveMagentoProductBySkuFlexible(sku),
    resolveErpForSession(sku),
  ]);

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
      options: getSupportedOptions(product.options),
      erpPriceGross: erp?.erpPriceGross ?? null,
      erpPriceCurrency: erp?.erpPriceCurrency ?? null,
      erpStockAvailable: erp?.erpStockAvailable ?? null,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
