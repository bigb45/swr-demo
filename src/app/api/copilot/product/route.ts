/**
 * GET /api/copilot/product?sku=
 *
 * Lightweight product projection for Copilot widgets (Magento admin REST, server-only).
 * Stock/price prefer enventa ERP (`unified_catalog_data`) when present.
 */

import type { NextRequest } from "next/server";
import { getSupportedOptions } from "@/lib/custom-options";
import {
  fetchErpDataForSkus,
  resolveEnventaCustomerId,
} from "@/lib/erp";
import { mergeErpStock } from "@/lib/erp-shared";
import type { ErpSkuData } from "@/lib/erp-shared";
import {
  fetchErpDataForSku,
  getConfigurableChildSkus,
  resolveMagentoProductBySkuFlexible,
} from "@/lib/magento";
import { getProductImageUrl } from "@/lib/magento-shared";
import { getStockStatus, type StockStatus } from "@/lib/stock";

/**
 * Configurable parents carry no enventa row — availability is the sum of the
 * variants' ERP stock. Returns null when no variant has ERP stock data.
 */
function aggregateVariantStock(rows: Array<ErpSkuData | null>): ErpSkuData | null {
  let qty: number | null = null;
  let available: boolean | null = null;

  for (const row of rows) {
    if (!row) continue;
    if (row.erpStockQty != null && Number.isFinite(row.erpStockQty)) {
      qty = (qty ?? 0) + row.erpStockQty;
    }
    if (row.erpStockAvailable != null) {
      available = available === true ? true : row.erpStockAvailable;
    }
  }

  if (qty == null && available == null) return null;
  return {
    netAmount: null,
    grossAmount: null,
    currency: null,
    quantityUnit: null,
    erpStockAvailable: available,
    erpStockQty: qty,
  };
}

export async function GET(req: NextRequest) {
  const sku = req.nextUrl.searchParams.get("sku")?.trim();
  if (!sku) {
    return Response.json({ error: "sku is required" }, { status: 400 });
  }

  const [product, enventaId] = await Promise.all([
    resolveMagentoProductBySkuFlexible(sku),
    resolveEnventaCustomerId(),
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

  const erp = enventaId
    ? (await fetchErpDataForSkus([sku], enventaId)).get(sku) ?? null
    : await fetchErpDataForSku(sku, null);

  const isConfigurable = product.type_id === "configurable";
  const variantStock = isConfigurable
    ? aggregateVariantStock(
        await Promise.all(
          (await getConfigurableChildSkus(product.sku)).map((childSku) =>
            fetchErpDataForSku(childSku, enventaId),
          ),
        ),
      )
    : null;

  const erpStock = variantStock ?? erp;
  const magentoStock = getStockStatus(product);
  // Availability is ERP-owned: without ERP data we report "unknown" rather
  // than falling back to Magento's optimistic in-stock flag.
  const stock: StockStatus =
    erpStock?.erpStockQty != null || erpStock?.erpStockAvailable != null
      ? mergeErpStock(magentoStock, erpStock)
      : { level: "unknown", qty: null };

  return Response.json(
    {
      sku: product.sku,
      name: product.name,
      price: product.price,
      typeId: product.type_id,
      imageUrl: getProductImageUrl(product),
      stockLevel: stock.level,
      options: getSupportedOptions(product.options),
      netAmount: erp?.netAmount ?? null,
      currency: erp?.currency ?? null,
      erpStockAvailable: erpStock?.erpStockAvailable ?? null,
      erpStockQty: erpStock?.erpStockQty ?? null,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
