"use client";

import { useEffect, useRef, useState } from "react";
import { useCustomerSession } from "@/components/CustomerSessionProvider";
import type { ErpPriceResult, ErpPriceState } from "@/lib/erp-shared";

/** Debounce qty changes only — SKU changes fetch immediately. */
const QTY_DEBOUNCE_MS = 300;

const priceCache = new Map<string, ErpPriceResult>();

function cacheKey(sku: string, qty: number): string {
  return `${sku}:${qty}`;
}

export interface UseErpPriceResult {
  state: ErpPriceState | "idle" | "loading";
  netAmount: number | null;
  grossAmount: number | null;
  currency: string | null;
  sku: string | null;
  qty: number;
}

/**
 * Seed the client ERP price cache (e.g. from list-batch `/api/erp/products`)
 * so a subsequent PDP open can show price + ATC without waiting.
 */
export function seedErpPriceCache(
  sku: string,
  qty: number,
  result: ErpPriceResult,
): void {
  const trimmed = sku.trim();
  if (!trimmed) return;
  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
  priceCache.set(cacheKey(trimmed, safeQty), {
    ...result,
    sku: trimmed,
    qty: safeQty,
  });
}

/**
 * Live ERP price for a SKU + qty.
 * SKU changes fetch immediately; qty changes are debounced.
 * Guests never hit the network — returns `no_customer` immediately.
 */
export function useErpPrice(
  sku: string | null,
  qty: number,
): UseErpPriceResult {
  const { isAuthenticated } = useCustomerSession();
  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
  const trimmed = sku?.trim() || null;
  const prevSkuRef = useRef<string | null>(null);

  const [result, setResult] = useState<UseErpPriceResult>(() => {
    if (!isAuthenticated || !trimmed) {
      return {
        state: "no_customer",
        netAmount: null,
        grossAmount: null,
        currency: null,
        sku: trimmed,
        qty: safeQty,
      };
    }
    const cached = priceCache.get(cacheKey(trimmed, safeQty));
    if (cached) {
      return {
        state: cached.state,
        netAmount: cached.netAmount,
        grossAmount: cached.grossAmount,
        currency: cached.currency,
        sku: cached.sku,
        qty: cached.qty,
      };
    }
    return {
      state: "idle",
      netAmount: null,
      grossAmount: null,
      currency: null,
      sku: trimmed,
      qty: safeQty,
    };
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !trimmed) {
      prevSkuRef.current = trimmed;
      setResult({
        state: "no_customer",
        netAmount: null,
        grossAmount: null,
        currency: null,
        sku: trimmed,
        qty: safeQty,
      });
      return;
    }

    const key = cacheKey(trimmed, safeQty);
    const cached = priceCache.get(key);
    if (cached) {
      prevSkuRef.current = trimmed;
      setResult({
        state: cached.state,
        netAmount: cached.netAmount,
        grossAmount: cached.grossAmount,
        currency: cached.currency,
        sku: cached.sku,
        qty: cached.qty,
      });
      return;
    }

    const skuChanged = prevSkuRef.current !== trimmed;
    prevSkuRef.current = trimmed;
    const delay = skuChanged ? 0 : QTY_DEBOUNCE_MS;

    setResult((prev) => ({
      ...prev,
      ...(skuChanged
        ? { netAmount: null, grossAmount: null, currency: null }
        : {}),
      state: "loading",
      sku: trimmed,
      qty: safeQty,
    }));

    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      void (async () => {
        try {
          const res = await fetch(
            `/api/erp-price?sku=${encodeURIComponent(trimmed)}&qty=${encodeURIComponent(String(safeQty))}`,
            {
              method: "GET",
              credentials: "same-origin",
              cache: "no-store",
              signal: controller.signal,
            },
          );
          if (!res.ok) {
            setResult({
              state: "error",
              netAmount: null,
              grossAmount: null,
              currency: null,
              sku: trimmed,
              qty: safeQty,
            });
            return;
          }
          const data = (await res.json()) as ErpPriceResult;
          priceCache.set(key, data);
          setResult({
            state: data.state,
            netAmount: data.netAmount,
            grossAmount: data.grossAmount,
            currency: data.currency,
            sku: data.sku,
            qty: data.qty,
          });
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setResult({
            state: "error",
            netAmount: null,
            grossAmount: null,
            currency: null,
            sku: trimmed,
            qty: safeQty,
          });
        }
      })();
    }, delay);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [isAuthenticated, trimmed, safeQty]);

  return result;
}
