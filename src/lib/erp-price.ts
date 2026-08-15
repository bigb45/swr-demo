/**
 * Server-only live ERP price via Teia Catalog Bridge.
 * Do not import from `"use client"` modules — use `/api/erp-price` instead.
 */

import { resolveEnventaCustomerId } from "@/lib/erp";
import type { ErpPriceResult, ErpPriceState, ErpSkuData } from "@/lib/erp-shared";

export type { ErpPriceResult, ErpPriceState } from "@/lib/erp-shared";

const BASE = process.env.MAGENTO_URL ?? "http://localhost:8000";

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asOptionalSku(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function emptyResult(
  state: ErpPriceState,
  sku: string,
  qty: number,
): ErpPriceResult {
  return {
    state,
    sku,
    qty,
    netAmount: null,
    grossAmount: null,
    currency: null,
    customerId: null,
  };
}

/**
 * Call Teia erpprice with an already-resolved enventa customer id.
 * Prefer this from batch helpers to avoid re-resolving the session per SKU.
 */
export async function fetchLiveErpPriceForCustomer(
  sku: string,
  qty: number,
  enventaCustomerId: string,
): Promise<ErpPriceResult> {
  const trimmed = sku.trim();
  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;

  if (!trimmed) return emptyResult("error", trimmed, safeQty);
  if (!enventaCustomerId.trim()) {
    return emptyResult("no_customer", trimmed, safeQty);
  }

  const url =
    `${BASE}/teia_catalogbridge/product/erpprice` +
    `/sku/${encodeURIComponent(trimmed)}/qty/${encodeURIComponent(String(safeQty))}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Enventa-Customer-Id": enventaCustomerId,
      },
      cache: "no-store",
    });

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      return emptyResult("error", trimmed, safeQty);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return emptyResult("error", trimmed, safeQty);
    }

    const data = body as Record<string, unknown>;

    if (data.success === true) {
      const netAmount = asFiniteNumber(data.net_amount);
      if (netAmount == null) {
        return {
          ...emptyResult("no_price", trimmed, safeQty),
          customerId: asFiniteNumber(data.customer_id),
        };
      }
      return {
        state: "priced",
        sku: asOptionalSku(data.sku) ?? trimmed,
        qty: asFiniteNumber(data.qty) ?? safeQty,
        netAmount,
        grossAmount: asFiniteNumber(data.gross_amount),
        currency:
          typeof data.currency === "string" && data.currency.trim()
            ? data.currency.trim().toUpperCase()
            : "EUR",
        customerId: asFiniteNumber(data.customer_id),
      };
    }

    const error = typeof data.error === "string" ? data.error : "error";
    if (error === "no_customer") {
      return emptyResult("no_customer", trimmed, safeQty);
    }
    if (error === "no_price" || error === "missing_sku") {
      return {
        ...emptyResult(error === "missing_sku" ? "error" : "no_price", trimmed, safeQty),
        customerId: asFiniteNumber(data.customer_id),
      };
    }
    return emptyResult("error", trimmed, safeQty);
  } catch {
    return emptyResult("error", trimmed, safeQty);
  }
}

/**
 * Fetch a customer- and quantity-specific net price for one child SKU.
 * Resolves the enventa customer id from the verified session — never from a
 * client-supplied header.
 */
export async function fetchLiveErpPrice(
  sku: string,
  qty: number,
): Promise<ErpPriceResult> {
  const trimmed = sku.trim();
  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
  if (!trimmed) return emptyResult("error", trimmed, safeQty);

  const enventaId = await resolveEnventaCustomerId();
  if (!enventaId) return emptyResult("no_customer", trimmed, safeQty);

  return fetchLiveErpPriceForCustomer(trimmed, safeQty, enventaId);
}

/** Map a live erpprice result into list/PDP `ErpSkuData` (price only; no stock). */
export function erpPriceResultToSkuData(
  result: ErpPriceResult,
): ErpSkuData | null {
  if (
    result.state !== "priced" ||
    result.netAmount == null ||
    !Number.isFinite(result.netAmount)
  ) {
    return null;
  }
  return {
    netAmount: result.netAmount,
    grossAmount: result.grossAmount,
    currency: result.currency,
    quantityUnit: null,
    erpStockAvailable: null,
    erpStockQty: null,
  };
}
