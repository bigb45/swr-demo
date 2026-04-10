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
import type { MagentoProduct } from "@/types/magento";

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
}

interface CartContextValue {
  items: CartItem[];
  cartId: string | null;
  loading: boolean;
  addItem: (product: MagentoProduct, qty: number) => Promise<void>;
  updateQty: (itemId: number, sku: string, qty: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_ID_KEY = "teia_cart_id";

async function ensureCart(): Promise<string> {
  const stored = localStorage.getItem(CART_ID_KEY);
  if (stored) return stored;

  const res = await fetch("/api/cart", { method: "POST" });
  if (!res.ok) throw new Error("Failed to create cart");
  const { cartId } = await res.json();
  localStorage.setItem(CART_ID_KEY, cartId);
  return cartId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  // Start as true so both the server render and the first client render
  // produce the same HTML (skeleton). The effect below resolves the real
  // cart state and sets loading to false, after which React updates the UI.
  // This prevents hydration mismatches caused by the server always seeing an
  // empty cart while the client may already have items in localStorage.
  const [loading, setLoading] = useState(true);

  // Load cart from Magento on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_ID_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }

    setCartId(stored);

    fetch(`/api/cart?cartId=${stored}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.items) {
          setItems(magentoItemsToCartItems(data.items));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
  }, [cartId]);

  const removeItem = useCallback(async (itemId: number) => {
    const id = cartId ?? localStorage.getItem(CART_ID_KEY);
    if (!id) return;
    await removeItemById(id, itemId, setItems);
  }, [cartId]);

  const clearCart = useCallback(() => {
    localStorage.removeItem(CART_ID_KEY);
    setCartId(null);
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, cartId, loading, addItem, updateQty, removeItem, clearCart, itemCount }}
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

function magentoItemsToCartItems(items: MagentoCartItem[]): CartItem[] {
  return items.map((item) => ({
    itemId: item.item_id,
    sku: item.sku,
    name: item.name,
    imageUrl: null, // images are not in the cart API response; ProductCard passes them via addItem
    unitPrice: item.price,
    qty: item.qty,
    stockStatus: "in_stock" as const,
    stockLabel: "In Stock",
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
