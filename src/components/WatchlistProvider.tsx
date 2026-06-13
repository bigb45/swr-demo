"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface WatchlistItem {
  sku: string;
  name: string;
  imageUrl: string | null;
  addedAt: number;
}

interface WatchlistContextValue {
  /** Client finished reading localStorage (avoids hydration mismatch). */
  ready: boolean;
  items: WatchlistItem[];
  count: number;
  has: (sku: string) => boolean;
  add: (item: Omit<WatchlistItem, "addedAt">) => void;
  remove: (sku: string) => void;
  toggle: (item: Omit<WatchlistItem, "addedAt">) => void;
  clear: () => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

const STORAGE_KEY = "swr_watchlist";

function readStored(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is WatchlistItem =>
        !!i &&
        typeof i === "object" &&
        typeof (i as WatchlistItem).sku === "string" &&
        typeof (i as WatchlistItem).name === "string",
    );
  } catch {
    return [];
  }
}

function persist(items: WatchlistItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /** storage unavailable / quota — keep in-memory state only */
  }
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<WatchlistItem[]>([]);

  // Resolve persisted state after mount so the server render and first client
  // render match (both empty), preventing hydration mismatches.
  useEffect(() => {
    setItems(readStored());
    setReady(true);
  }, []);

  // Keep other tabs in sync.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setItems(readStored());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const has = useCallback(
    (sku: string) => items.some((i) => i.sku === sku),
    [items],
  );

  const add = useCallback((item: Omit<WatchlistItem, "addedAt">) => {
    setItems((prev) => {
      if (prev.some((i) => i.sku === item.sku)) return prev;
      const next = [{ ...item, addedAt: Date.now() }, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const remove = useCallback((sku: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.sku !== sku);
      persist(next);
      return next;
    });
  }, []);

  const toggle = useCallback((item: Omit<WatchlistItem, "addedAt">) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.sku === item.sku);
      const next = exists
        ? prev.filter((i) => i.sku !== item.sku)
        : [{ ...item, addedAt: Date.now() }, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    persist([]);
  }, []);

  const value = useMemo(
    (): WatchlistContextValue => ({
      ready,
      items,
      count: items.length,
      has,
      add,
      remove,
      toggle,
      clear,
    }),
    [ready, items, has, add, remove, toggle, clear],
  );

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return ctx;
}
