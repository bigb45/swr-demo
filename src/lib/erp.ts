/**
 * Server-only enventa ERP helpers for product listings and PDP.
 * Do not import from `"use client"` modules — use `/api/erp/products` instead.
 *
 * List/PDP prices come from the same Teia Catalog Bridge erpprice endpoint
 * as the configurable variant picker (`fetchLiveErpPriceForCustomer`).
 */

import { cache } from "react";
import { fetchCustomerMe, getCustomerToken } from "@/lib/checkout";
import {
  erpPriceResultToSkuData,
  fetchLiveErpPriceForCustomer,
} from "@/lib/erp-price";
import {
  enventaIdFromCustomerAttrs,
  fetchEnventaCustomerId,
} from "@/lib/magento";
import type { ErpSkuData } from "@/lib/erp-shared";

const ERP_FANOUT_CONCURRENCY = 6;
const ERP_MEMO_TTL_MS = 30_000;
/** List cards and simple PDP use qty=1 for the contract unit price. */
const LIST_PRICE_QTY = 1;

type MemoEntry = { expiresAt: number; data: ErpSkuData | null };

const erpMemo = new Map<string, MemoEntry>();

function memoKey(enventaId: string | null, sku: string): string {
  return `${enventaId ?? "_guest"}:${sku}:q${LIST_PRICE_QTY}`;
}

function readMemo(key: string): ErpSkuData | null | undefined {
  const hit = erpMemo.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    erpMemo.delete(key);
    return undefined;
  }
  return hit.data;
}

function writeMemo(key: string, data: ErpSkuData | null) {
  erpMemo.set(key, { expiresAt: Date.now() + ERP_MEMO_TTL_MS, data });
}

/**
 * Resolve the logged-in shopper's enventa customer id (request-memoized).
 * Guests and accounts without the attribute return null — never throws.
 */
export const resolveEnventaCustomerId = cache(
  async (): Promise<string | null> => {
    try {
      const token = await getCustomerToken();
      if (!token) return null;
      const me = await fetchCustomerMe(token);
      if (!me) return null;
      return (
        enventaIdFromCustomerAttrs(me) ??
        (await fetchEnventaCustomerId(me.id))
      );
    } catch {
      return null;
    }
  },
);

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await worker(items[i]);
    }
  }

  const runners = Array.from(
    { length: Math.min(concurrency, Math.max(items.length, 1)) },
    () => run(),
  );
  await Promise.all(runners);
  return results;
}

/**
 * Fan-out live ERP price lookups (Teia erpprice, qty=1). One bad SKU never
 * drops the batch. Results are memoized for 30s per `${enventaId}:${sku}`.
 */
export async function fetchErpDataForSkus(
  skus: string[],
  enventaId: string | null,
): Promise<Map<string, ErpSkuData>> {
  const unique = Array.from(
    new Set(
      skus
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  );

  const out = new Map<string, ErpSkuData>();
  if (unique.length === 0 || !enventaId) return out;

  const pending: string[] = [];
  for (const sku of unique) {
    const cached = readMemo(memoKey(enventaId, sku));
    if (cached === undefined) {
      pending.push(sku);
    } else if (cached != null) {
      out.set(sku, cached);
    }
  }

  if (pending.length === 0) return out;

  await mapWithConcurrency(pending, ERP_FANOUT_CONCURRENCY, async (sku) => {
    try {
      const result = await fetchLiveErpPriceForCustomer(
        sku,
        LIST_PRICE_QTY,
        enventaId,
      );
      const data = erpPriceResultToSkuData(result);
      writeMemo(memoKey(enventaId, sku), data);
      if (data) out.set(sku, data);
    } catch {
      writeMemo(memoKey(enventaId, sku), null);
    }
  });

  return out;
}

/** Qty-aware ERP net for one cart/quote line (Teia erpprice). */
export interface ErpCartRowPrice {
  unitNet: number;
  rowNet: number;
  currency: string;
}

/**
 * Fetch ERP net for cart lines at each line's qty. Index-aligned with input;
 * `null` when Teia has no price for that row.
 */
export async function fetchErpRowPrices(
  lines: Array<{ sku: string; qty: number }>,
  enventaId: string,
): Promise<Array<ErpCartRowPrice | null>> {
  if (!enventaId.trim() || lines.length === 0) {
    return lines.map(() => null);
  }

  return mapWithConcurrency(lines, ERP_FANOUT_CONCURRENCY, async (line) => {
    const sku = line.sku.trim();
    const qty =
      Number.isFinite(line.qty) && line.qty > 0 ? Math.floor(line.qty) : 1;
    if (!sku) return null;
    try {
      const result = await fetchLiveErpPriceForCustomer(sku, qty, enventaId);
      if (
        result.state !== "priced" ||
        result.netAmount == null ||
        !Number.isFinite(result.netAmount)
      ) {
        return null;
      }
      const rowNet = result.netAmount;
      return {
        unitNet: qty > 0 ? rowNet / qty : rowNet,
        rowNet,
        currency: result.currency?.trim() || "EUR",
      };
    } catch {
      return null;
    }
  });
}

/**
 * Overlay ERP net onto Magento guest-cart items + totals for storefront
 * display. Magento catalog/quote prices stay 0 for ERP-driven SKUs.
 * Leaves Magento shipping; recomputes subtotal / grand from ERP rows.
 */
export async function applyErpPricingToCartDisplay<
  TItem extends { sku: string; qty: number; price: number },
  TTotals extends {
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
>(
  items: TItem[],
  totals: TTotals,
  enventaId: string | null,
): Promise<{ items: TItem[]; totals: TTotals }> {
  if (!enventaId || items.length === 0) {
    return { items, totals };
  }

  const rows = await fetchErpRowPrices(
    items.map((i) => ({ sku: i.sku, qty: i.qty })),
    enventaId,
  );

  let erpSubtotal = 0;
  let anyErp = false;
  const pricedItems = items.map((item, i) => {
    const row = rows[i];
    if (!row) return item;
    anyErp = true;
    erpSubtotal += row.rowNet;
    return { ...item, price: row.unitNet };
  });

  if (!anyErp) return { items, totals };

  const shipping = totals.shipping_amount ?? 0;
  const tax = totals.tax_amount ?? 0;
  const nextItems = (totals.items ?? []).map((tItem, i) => {
    const row = rows[i];
    if (!row) return tItem;
    return {
      ...tItem,
      price: row.unitNet,
      row_total: row.rowNet,
      row_total_incl_tax: row.rowNet,
    };
  });

  return {
    items: pricedItems,
    totals: {
      ...totals,
      subtotal: erpSubtotal,
      subtotal_with_discount: erpSubtotal,
      grand_total: erpSubtotal + shipping + tax,
      items: nextItems.length > 0 ? nextItems : totals.items,
    },
  };
}
