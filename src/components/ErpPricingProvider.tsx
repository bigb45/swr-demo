"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { seedErpPriceCache } from "@/components/product/useErpPrice";
import type { ErpSkuData } from "@/lib/erp-shared";

type ErpApiState = "ok" | "no_customer" | null;

interface ErpPricingInternal {
  registerSku: (sku: string) => void;
  items: Record<string, ErpSkuData>;
  loaded: Set<string>;
  apiState: ErpApiState;
  isAuthenticated: boolean;
}

const ErpPricingInternalContext = createContext<ErpPricingInternal | null>(
  null,
);

/**
 * Batches live enventa ERP price lookups for list surfaces after paint.
 * Uses the same Teia erpprice bridge as the PDP variant picker
 * (`/api/erp/products` → `fetchLiveErpPriceForCustomer`).
 * Inert for guests — zero network traffic.
 * Configurable parents should not register (callers pass empty sku).
 */
export function ErpPricingProvider({
  children,
  isAuthenticated,
}: {
  children: ReactNode;
  isAuthenticated: boolean;
}) {
  const [items, setItems] = useState<Record<string, ErpSkuData>>({});
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const [apiState, setApiState] = useState<ErpApiState>(null);
  const pendingRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Set<string>>(new Set());
  const loadedRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (!isAuthenticated) return;
    const batch = Array.from(pendingRef.current).filter(
      (sku) => !loadedRef.current.has(sku) && !inFlightRef.current.has(sku),
    );
    pendingRef.current.clear();
    if (batch.length === 0) return;

    for (const sku of batch) inFlightRef.current.add(sku);

    try {
      const res = await fetch("/api/erp/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ skus: batch }),
      });
      if (!res.ok) {
        for (const sku of batch) loadedRef.current.add(sku);
        setLoaded(new Set(loadedRef.current));
        return;
      }
      const data = (await res.json()) as {
        state?: "ok" | "no_customer";
        items?: Record<string, ErpSkuData>;
      };
      if (data.state === "no_customer") {
        setApiState("no_customer");
      } else {
        setApiState("ok");
      }
      const next = data.items ?? {};
      setItems((prev) => {
        const merged = { ...prev };
        for (const sku of batch) {
          loadedRef.current.add(sku);
          const row = next[sku];
          if (row) {
            merged[sku] = row;
            // Seed PDP cache so opening a simple product shows price + ATC fast.
            if (
              row.netAmount != null &&
              Number.isFinite(row.netAmount)
            ) {
              seedErpPriceCache(sku, 1, {
                state: "priced",
                sku,
                qty: 1,
                netAmount: row.netAmount,
                grossAmount: row.grossAmount,
                currency: row.currency,
                customerId: null,
              });
            } else if (data.state === "ok") {
              seedErpPriceCache(sku, 1, {
                state: "no_price",
                sku,
                qty: 1,
                netAmount: null,
                grossAmount: null,
                currency: null,
                customerId: null,
              });
            }
          } else if (data.state === "ok") {
            seedErpPriceCache(sku, 1, {
              state: "no_price",
              sku,
              qty: 1,
              netAmount: null,
              grossAmount: null,
              currency: null,
              customerId: null,
            });
          } else if (data.state === "no_customer") {
            seedErpPriceCache(sku, 1, {
              state: "no_customer",
              sku,
              qty: 1,
              netAmount: null,
              grossAmount: null,
              currency: null,
              customerId: null,
            });
          }
        }
        return merged;
      });
      setLoaded(new Set(loadedRef.current));
    } catch {
      for (const sku of batch) loadedRef.current.add(sku);
      setLoaded(new Set(loadedRef.current));
    } finally {
      for (const sku of batch) inFlightRef.current.delete(sku);
    }
  }, [isAuthenticated]);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current != null) return;
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      void flush();
    }, 0);
  }, [flush]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current != null) {
        clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  const registerSku = useCallback(
    (sku: string) => {
      if (!isAuthenticated) return;
      const trimmed = sku.trim();
      if (!trimmed) return;
      if (
        loadedRef.current.has(trimmed) ||
        inFlightRef.current.has(trimmed) ||
        pendingRef.current.has(trimmed)
      ) {
        return;
      }
      pendingRef.current.add(trimmed);
      scheduleFlush();
    },
    [isAuthenticated, scheduleFlush],
  );

  const api = useMemo(
    () => ({ registerSku, items, loaded, apiState, isAuthenticated }),
    [registerSku, items, loaded, apiState, isAuthenticated],
  );

  return (
    <ErpPricingInternalContext.Provider value={api}>
      {children}
    </ErpPricingInternalContext.Provider>
  );
}

export interface UseErpProductResult {
  data: ErpSkuData | null;
  loading: boolean;
  noCustomer: boolean;
}

/**
 * Subscribe a list-surface component to ERP price/stock for `sku`.
 * Pass an empty sku for configurables to skip registration.
 */
export function useErpProduct(sku: string): ErpSkuData | null {
  return useErpProductState(sku).data;
}

export function useErpProductState(sku: string): UseErpProductResult {
  const ctx = useContext(ErpPricingInternalContext);
  const trimmed = sku.trim();
  const isAuthenticated = ctx?.isAuthenticated ?? false;
  const registerSku = ctx?.registerSku;
  const item = trimmed && ctx ? (ctx.items[trimmed] ?? null) : null;
  const loaded = trimmed && ctx ? ctx.loaded.has(trimmed) : false;
  const noCustomer = ctx?.apiState === "no_customer";

  useEffect(() => {
    if (!isAuthenticated || !trimmed || !registerSku) return;
    registerSku(trimmed);
  }, [isAuthenticated, registerSku, trimmed]);

  return {
    data: item,
    loading: Boolean(isAuthenticated && trimmed && !loaded && !item),
    noCustomer,
  };
}
