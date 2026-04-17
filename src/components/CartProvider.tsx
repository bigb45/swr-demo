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
import type { MagentoProduct, MagentoCartTotals } from "@/types/magento";

export interface CartItem {
  itemId: number;
  sku: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  stockStatus: "in_stock" | "lead_time" | "unavailable";
  stockLabel: string;
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
  addItem: (product: MagentoProduct, qty: number) => Promise<void>;
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

  const fetchCart = useCallback(async (id: string) => {
    const r = await fetch(`/api/cart?cartId=${id}`);
    if (!r.ok) return;
    const data = await r.json();
    if (data?.items) {
      setItems((prev) => magentoItemsToCartItems(data.items, prev));
    }
    if (data?.totals) setTotals(data.totals as MagentoCartTotals);
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
    fetchCart(stored).catch(() => {}).finally(() => setLoading(false));
  }, [fetchCart]);

  const refreshTotals = useCallback(async () => {
    const id = cartId ?? localStorage.getItem(CART_ID_KEY);
    if (!id) return;
    await fetchCart(id).catch(() => {});
  }, [cartId, fetchCart]);

  const addItem = useCallback(async (product: MagentoProduct, qty: number) => {
    const id = await ensureCart();
    setCartId(id);

    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartId: id, sku: product.sku, qty }),
    });

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
          stockStatus: product.status === 1 ? "in_stock" : "unavailable",
          stockLabel: product.status === 1 ? "In Stock" : "Unavailable",
        },
      ];
    });
  }, []);

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
    const id = await ensureCart();
    setCartId(id);

    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartId: id, sku: item.sku, qty: item.qty }),
    });

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
      value={{ items, totals, cartId, loading, addItem, updateQty, removeItem, restoreItem, clearCart, resetCartId, refreshTotals, itemCount }}
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
  return items.map((item) => ({
    ...(previous.find((prev) => prev.itemId === item.item_id || prev.sku === item.sku) ?? {}),
    itemId: item.item_id,
    sku: item.sku,
    name: item.name,
    imageUrl:
      item.imageUrl ??
      previous.find((prev) => prev.itemId === item.item_id || prev.sku === item.sku)?.imageUrl ??
      null,
    unitPrice: item.price,
    qty: item.qty,
    stockStatus:
      previous.find((prev) => prev.itemId === item.item_id || prev.sku === item.sku)?.stockStatus ??
      "in_stock",
    stockLabel:
      previous.find((prev) => prev.itemId === item.item_id || prev.sku === item.sku)?.stockLabel ??
      "In Stock",
  }));
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
