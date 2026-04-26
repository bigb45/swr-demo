"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getProductImageUrl } from "@/lib/magento";
import { getStockStatus, type StockLevel } from "@/lib/stock";
import type { MagentoProduct, MagentoCartTotals } from "@/types/magento";

export interface CartItem {
  itemId: number;
  sku: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  stockLevel: StockLevel;
}

interface MagentoCartItem {
  item_id: number;
  sku: string;
  qty: number;
  name: string;
  price: number;
  product_type: string;
  quote_id: string;
  imageUrl?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  totals: MagentoCartTotals | null;
  cartId: string | null;
  loading: boolean;
  /**
   * Set when the latest cart fetch against /api/cart failed for a reason other
   * than "cart does not exist" (network error, 5xx, parse failure). Lets the
   * UI distinguish a genuine empty cart from an unavailable backend so mobile
   * users don't see a misleading empty state.
   */
  fetchError: boolean;
  addItem: (product: MagentoProduct, qty: number) => Promise<void>;
  /**
   * Add a line to the cart by SKU alone. Used for reorder + CSV import where
   * we only have `{sku, qty}` in hand and no full MagentoProduct. Throws on
   * Magento errors so callers can collect per-line outcomes.
   */
  addBySku: (sku: string, qty: number) => Promise<void>;
  updateQty: (itemId: number, sku: string, qty: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  restoreItem: (item: CartItem) => Promise<void>;
  clearCart: () => void;
  /**
   * Drops the local cart state and the masked-id cookie/localStorage entry
   * without going to the server. Used by the checkout flow after the order
   * has been placed (the server already converted the cart into an order).
   */
  resetCartId: () => void;
  refreshTotals: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_ID_KEY = "swr_cart_id";
const CART_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Mirror the cart id into a non-httpOnly cookie so server components (notably
 * the /checkout pages) can read it via next/headers `cookies()` without
 * needing the client to round-trip through an API route. The masked guest
 * cart id is not sensitive — it already lives in localStorage and is sent on
 * every cart API request — so a regular client-set cookie is fine.
 */
function persistCartId(cartId: string) {
  localStorage.setItem(CART_ID_KEY, cartId);
  document.cookie = `${CART_ID_KEY}=${encodeURIComponent(cartId)}; path=/; max-age=${CART_ID_COOKIE_MAX_AGE}; samesite=lax`;
}

function clearPersistedCartId() {
  localStorage.removeItem(CART_ID_KEY);
  document.cookie = `${CART_ID_KEY}=; path=/; max-age=0; samesite=lax`;
}

async function ensureCart(): Promise<string> {
  const stored = localStorage.getItem(CART_ID_KEY);
  if (stored) {
    // Re-set the cookie in case it expired or was cleared on the server.
    persistCartId(stored);
    return stored;
  }

  const res = await fetch("/api/cart", { method: "POST" });
  if (!res.ok) throw new Error("Failed to create cart");
  const { cartId } = await res.json();
  persistCartId(cartId);
  return cartId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<MagentoCartTotals | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  // Start as true so both the server render and the first client render
  // produce the same HTML (skeleton). The effect below resolves the real
  // cart state and sets loading to false, after which React updates the UI.
  // This prevents hydration mismatches caused by the server always seeing an
  // empty cart while the client may already have items in localStorage.
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchCart = useCallback(async (id: string) => {
    let r: Response;
    try {
      r = await fetch(`/api/cart?cartId=${id}`);
    } catch {
      // Network failure (offline, DNS, etc.) — keep whatever items we already
      // have in state so the user doesn't see a misleading empty cart.
      setFetchError(true);
      return;
    }

    if (r.status === 404) {
      // The stored cart id no longer exists in Magento (backend restart, quote
      // converted to an order, etc.). Drop it so the next add creates a fresh
      // one instead of repeatedly hitting a dead id.
      clearPersistedCartId();
      setCartId(null);
      setItems([]);
      setTotals(null);
      setFetchError(false);
      return;
    }
    if (!r.ok) {
      setFetchError(true);
      return;
    }

    try {
      const data = await r.json();
      if (data?.items) {
        setItems((prev) => magentoItemsToCartItems(data.items, prev));
      }
      if (data?.totals) setTotals(data.totals as MagentoCartTotals);
      setFetchError(false);
    } catch {
      setFetchError(true);
    }
  }, []);

  // Load cart from Magento on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_ID_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }

    setCartId(stored);
    persistCartId(stored);
    fetchCart(stored).finally(() => setLoading(false));
  }, [fetchCart]);

  const refreshTotals = useCallback(async () => {
    const id = cartId ?? localStorage.getItem(CART_ID_KEY);
    if (!id) return;
    await fetchCart(id);
  }, [cartId, fetchCart]);

  const addItem = useCallback(async (product: MagentoProduct, qty: number) => {
    let id = await ensureCart();
    setCartId(id);

    let res = await postCartItem(id, product.sku, qty);

    if (!res.ok && (await isStaleCartResponse(res))) {
      // Stored cart id no longer exists in Magento — wipe it and retry once
      // with a fresh cart so the click still succeeds.
      clearPersistedCartId();
      id = await ensureCart();
      setCartId(id);
      res = await postCartItem(id, product.sku, qty);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to add item");
    }

    const added: MagentoCartItem = await res.json();

    setItems((prev) => {
      const existing = prev.find((i) => i.sku === added.sku);
      if (existing) {
        return prev.map((i) =>
          i.sku === added.sku ? { ...i, qty: added.qty, itemId: added.item_id } : i
        );
      }
      return [
        ...prev,
        {
          itemId: added.item_id,
          sku: added.sku,
          name: added.name,
          imageUrl: getProductImageUrl(product),
          unitPrice: added.price,
          qty: added.qty,
          stockLevel: getStockStatus(product).level,
        },
      ];
    });
  }, []);

  const addBySku = useCallback(async (sku: string, qty: number) => {
    let id = await ensureCart();
    setCartId(id);

    let res = await postCartItem(id, sku, qty);

    if (!res.ok && (await isStaleCartResponse(res))) {
      clearPersistedCartId();
      id = await ensureCart();
      setCartId(id);
      res = await postCartItem(id, sku, qty);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to add item");
    }

    await fetchCart(id);
  }, [fetchCart]);

  const updateQty = useCallback(async (itemId: number, sku: string, qty: number) => {
    const id = cartId ?? localStorage.getItem(CART_ID_KEY);
    if (!id) return;

    if (qty <= 0) {
      return removeItemById(id, itemId, setItems);
    }

    const res = await fetch(`/api/cart/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartId: id, sku, qty }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to update qty");
    }

    setItems((prev) =>
      prev.map((i) => (i.itemId === itemId ? { ...i, qty } : i))
    );
    await refreshTotals();
  }, [cartId, refreshTotals]);

  const removeItem = useCallback(async (itemId: number) => {
    const id = cartId ?? localStorage.getItem(CART_ID_KEY);
    if (!id) return;
    await removeItemById(id, itemId, setItems);
    await refreshTotals();
  }, [cartId, refreshTotals]);

  const restoreItem = useCallback(async (item: CartItem) => {
    let id = await ensureCart();
    setCartId(id);

    let res = await postCartItem(id, item.sku, item.qty);

    if (!res.ok && (await isStaleCartResponse(res))) {
      clearPersistedCartId();
      id = await ensureCart();
      setCartId(id);
      res = await postCartItem(id, item.sku, item.qty);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to restore item");
    }

    const added: MagentoCartItem = await res.json();

    setItems((prev) => {
      const existing = prev.find((i) => i.sku === added.sku);
      if (existing) {
        return prev.map((i) =>
          i.sku === added.sku ? { ...i, qty: added.qty, itemId: added.item_id } : i
        );
      }

      return [
        ...prev,
        {
          ...item,
          itemId: added.item_id,
          qty: added.qty,
          unitPrice: added.price,
        },
      ];
    });

    await refreshTotals();
  }, [refreshTotals]);

  const clearCart = useCallback(() => {
    clearPersistedCartId();
    setCartId(null);
    setItems([]);
    setTotals(null);
  }, []);

  // Same effect as clearCart today; named separately to convey intent (the
  // checkout flow uses this after the server has already turned the cart
  // into an order, so there's nothing left to "clear" on the backend).
  const resetCartId = useCallback(() => {
    clearPersistedCartId();
    setCartId(null);
    setItems([]);
    setTotals(null);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, totals, cartId, loading, fetchError, addItem, addBySku, updateQty, removeItem, restoreItem, clearCart, resetCartId, refreshTotals, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

// ── helpers ────────────────────────────────────────────────────────────────

function magentoItemsToCartItems(items: MagentoCartItem[], previous: CartItem[]): CartItem[] {
  return items.map((item) => {
    const match = previous.find(
      (prev) => prev.itemId === item.item_id || prev.sku === item.sku,
    );
    return {
      itemId: item.item_id,
      sku: item.sku,
      name: item.name,
      imageUrl: item.imageUrl ?? match?.imageUrl ?? null,
      unitPrice: item.price,
      qty: item.qty,
      stockLevel: match?.stockLevel ?? "unknown",
    };
  });
}

function postCartItem(cartId: string, sku: string, qty: number): Promise<Response> {
  return fetch("/api/cart/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartId, sku, qty }),
  });
}

/**
 * Magento returns 404 (cart missing) or 400 with a "No such entity with cartId
 * = ..." message when a guest cart no longer exists. Either signal means the
 * id we have is dead and the caller should request a brand new cart.
 */
async function isStaleCartResponse(res: Response): Promise<boolean> {
  if (res.status === 404) return true;
  if (res.status !== 400) return false;
  const body = await res.clone().json().catch(() => null);
  return typeof body?.error === "string" && /no such entity.*cartid/i.test(body.error);
}

async function removeItemById(
  cartId: string,
  itemId: number,
  setItems: React.Dispatch<React.SetStateAction<CartItem[]>>
) {
  const res = await fetch(`/api/cart/items/${itemId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to remove item");
  }

  setItems((prev) => prev.filter((i) => i.itemId !== itemId));
}
