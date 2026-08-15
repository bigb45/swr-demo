/**
 * Client-safe ERP helpers shared by list cards, PDP, and Copilot.
 * No Node/server imports — safe to use from `"use client"` components.
 */

import {
  LOW_STOCK_THRESHOLD,
  type StockStatus,
} from "@/lib/stock";

/** Parsed enventa price/stock for a single SKU (net-first for B2B). */
export interface ErpSkuData {
  netAmount: number | null;
  grossAmount: number | null;
  currency: string | null;
  quantityUnit: string | null;
  erpStockAvailable: boolean | null;
  erpStockQty: number | null;
}

/** Optional PIM slice attached when the unified catalog payload includes it. */
export interface ErpPimData {
  name: string | null;
  description: string | null;
  isDiscontinued: boolean;
  images: Array<{ url: string; position: number }>;
  attributes: Array<{ code: string; value: string }>;
}

export type PriceDisplay =
  | { kind: "amount"; net: number; currency: string }
  | { kind: "login" }
  | { kind: "onRequest" }
  | { kind: "loading" };

export type ErpPriceState = "priced" | "no_customer" | "no_price" | "error";

/** Normalized response from `/api/erp-price` (and the Magento bridge). */
export interface ErpPriceResult {
  state: ErpPriceState;
  sku: string;
  qty: number;
  netAmount: number | null;
  grossAmount: number | null;
  currency: string | null;
  customerId: number | null;
}

export function formatErpPrice(
  amount: number,
  currency: string,
  locale: string,
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Resolve display state from ERP data + auth. Magento catalog price is never
 * used — only a finite `netAmount` counts as a priced result.
 */
export function resolvePriceDisplay(
  erp: ErpSkuData | null | undefined,
  opts: {
    isAuthenticated: boolean;
    hasEnventaCustomer?: boolean;
    loading?: boolean;
  },
): PriceDisplay {
  if (opts.loading) return { kind: "loading" };

  if (
    erp?.netAmount != null &&
    Number.isFinite(erp.netAmount)
  ) {
    return {
      kind: "amount",
      net: erp.netAmount,
      currency: erp.currency?.trim() || "EUR",
    };
  }

  if (!opts.isAuthenticated || opts.hasEnventaCustomer === false) {
    return { kind: "login" };
  }

  return { kind: "onRequest" };
}

function qtyToStatus(qty: number): StockStatus {
  if (qty <= 0) return { level: "out", qty };
  if (qty <= LOW_STOCK_THRESHOLD) return { level: "low", qty };
  return { level: "in", qty };
}

/**
 * Prefer enventa stock when present (qty → low/in/out; boolean alone →
 * in/out). Otherwise keep Magento MSI / stock_item status.
 */
export function mergeErpStock(
  magentoStatus: StockStatus,
  erp: ErpSkuData | null | undefined,
): StockStatus {
  if (erp?.erpStockQty != null && Number.isFinite(erp.erpStockQty)) {
    return qtyToStatus(erp.erpStockQty);
  }
  if (erp?.erpStockAvailable === true) {
    return { level: "in", qty: magentoStatus.qty };
  }
  if (erp?.erpStockAvailable === false) {
    return { level: "out", qty: 0 };
  }
  return magentoStatus;
}
