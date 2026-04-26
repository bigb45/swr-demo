/**
 * Stock resolution shared by PDP, product cards, and any other surface that
 * needs an "in stock / low stock / out of stock / unknown" state from a
 * Magento product.
 *
 * The Magento REST API surfaces inventory on the product payload in two
 * shapes: the pre-MSI `extension_attributes.stock_item` (always present on a
 * default install) and, when MSI is on, a numeric `extension_attributes
 * .salable_quantity`. We prefer MSI when available, fall back to the legacy
 * stock_item, and finally fall back to the admin-controlled `status` flag so
 * the UI never shows "unknown" just because a store was configured without
 * tracking qty.
 */

import type { MagentoProduct, MagentoStockItem } from "@/types/magento";

export type StockLevel = "in" | "low" | "out" | "unknown";

export interface StockStatus {
  level: StockLevel;
  qty: number | null;
}

/**
 * Low-stock threshold (inclusive). Products with `qty <= LOW_STOCK_THRESHOLD`
 * but > 0 show the "low stock" treatment. Kept small by default because SWR
 * sells professional kit in low unit counts; tune as real data lands.
 */
export const LOW_STOCK_THRESHOLD = 5;

function readMsiSalableQty(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    // MSI returns `[{ stock_id, qty, manage_stock }]` — use the max qty across
    // available sources so the "in stock" treatment wins when any source has
    // units.
    let best: number | null = null;
    for (const entry of value) {
      if (entry && typeof entry === "object") {
        const q = (entry as { qty?: unknown }).qty;
        if (typeof q === "number" && Number.isFinite(q)) {
          best = best === null ? q : Math.max(best, q);
        }
      }
    }
    return best;
  }
  return null;
}

/**
 * Derive a display-ready stock level from a Magento product payload.
 *
 * Resolution order:
 *  1. If the product is disabled (`status !== 1`), treat as out of stock.
 *  2. MSI `salable_quantity` (numeric or per-source array).
 *  3. Legacy `stock_item.qty` + `is_in_stock` + `manage_stock`.
 *  4. `status === 1` → in stock fallback (qty unknown).
 */
export function getStockStatus(product: MagentoProduct): StockStatus {
  if (product.status !== 1) {
    return { level: "out", qty: 0 };
  }

  const ext = product.extension_attributes;
  const msiQty = ext ? readMsiSalableQty(ext.salable_quantity) : null;
  if (msiQty !== null) {
    return qtyToStatus(msiQty);
  }

  const stockItem: MagentoStockItem | undefined = ext?.stock_item;
  if (stockItem) {
    if (stockItem.manage_stock === false) {
      return stockItem.is_in_stock === false
        ? { level: "out", qty: null }
        : { level: "in", qty: null };
    }
    if (stockItem.is_in_stock === false) {
      return { level: "out", qty: stockItem.qty ?? 0 };
    }
    if (typeof stockItem.qty === "number") {
      return qtyToStatus(stockItem.qty);
    }
    return { level: "in", qty: null };
  }

  return { level: "in", qty: null };
}

function qtyToStatus(qty: number): StockStatus {
  if (qty <= 0) return { level: "out", qty };
  if (qty <= LOW_STOCK_THRESHOLD) return { level: "low", qty };
  return { level: "in", qty };
}
