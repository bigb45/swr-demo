/**
 * Teia chat stream final events use `done` plus cart metadata in `action` and/or
 * `intent` (observed: `action` may be null while `intent` holds the op — Luma
 * only reads `action`). Normalize and apply via storefront cart APIs.
 */

import type { MagentoCustomOptionSelection } from "@/types/magento";
import type { AddToCartOptions } from "@/components/CartProvider";

export type TeiaCartOpType = "add_to_cart" | "remove_from_cart" | "update_cart";

/** A resolved custom-option choice the agent already validated against the
 * product (`option_id`/`value_id` are Magento option ids, not labels). */
export interface TeiaCartOption {
  option_id: string;
  value_id: string;
}

export interface TeiaCartOp {
  type: TeiaCartOpType;
  sku?: string;
  qty: number;
  options?: TeiaCartOption[];
}

function pickString(
  o: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = o[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function pickQty(o: Record<string, unknown>): number | undefined {
  for (const key of ["qty", "quantity"]) {
    const v = o[key];
    if (typeof v === "number" && Number.isFinite(v) && v >= 1) {
      return Math.floor(v);
    }
  }
  return undefined;
}

function coerceRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const p: unknown = JSON.parse(raw);
      if (p && typeof p === "object" && !Array.isArray(p)) {
        return p as Record<string, unknown>;
      }
    } catch {
      return null;
    }
    return null;
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return null;
}

const TYPE_ALIASES: Record<string, TeiaCartOpType | undefined> = {
  add_to_cart: "add_to_cart",
  add: "add_to_cart",
  remove_from_cart: "remove_from_cart",
  remove: "remove_from_cart",
  update_cart: "update_cart",
  update: "update_cart",
};

function normalizeOpType(raw: string): TeiaCartOpType | null {
  const t = raw.trim().toLowerCase().replace(/\s+/g, "_");
  return TYPE_ALIASES[t] ?? null;
}

/**
 * Flatten Teia / tool-style payloads into { type, sku, qty }.
 */
function unwrapCartOp(raw: unknown): TeiaCartOp | null {
  if (Array.isArray(raw) && raw.length > 0) {
    return unwrapCartOp(raw[0]);
  }

  const top = coerceRecord(raw);
  if (!top) return null;

  const nestedKeys = ["parameters", "params", "payload", "args", "arguments"];
  let fields: Record<string, unknown> = { ...top };
  for (const nk of nestedKeys) {
    const inner = coerceRecord(top[nk]);
    if (inner) {
      fields = { ...top, ...inner };
      break;
    }
  }

  let typeRaw =
    pickString(top, "type") ??
    pickString(fields, "type") ??
    pickString(top, "name") ??
    pickString(fields, "name") ??
    (typeof top["intent"] === "string" ? (top["intent"] as string) : undefined);

  // OpenAI-style tool call: { name: "add_to_cart", arguments: "{\"sku\":\"…\"}" }
  if (!typeRaw) {
    const fnName = pickString(top, "function");
    const argStr = top["arguments"];
    if (fnName && typeof argStr === "string") {
      const argObj = coerceRecord(argStr);
      if (argObj) {
        typeRaw = fnName;
        fields = { ...top, ...argObj };
      }
    }
  }

  const sku =
    pickString(fields, "sku") ??
    pickString(fields, "product_sku") ??
    pickString(fields, "item_sku");

  const qty = pickQty(fields) ?? 1;

  const options = unwrapCartOptions(fields["options"]);

  if (!typeRaw) return null;
  const type = normalizeOpType(typeRaw);
  if (!type) return null;

  return { type, sku, qty, options };
}

/**
 * Parse an agent `options` array of `{ option_id, value_id }` (accepting the
 * `option_value` alias) into validated custom-option choices. Returns undefined
 * when absent or empty so add-to-cart stays byte-for-byte identical for
 * option-less products.
 */
function unwrapCartOptions(raw: unknown): TeiaCartOption[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const options: TeiaCartOption[] = [];
  for (const entry of raw) {
    const rec = coerceRecord(entry);
    if (!rec) continue;
    const optionId = pickString(rec, "option_id");
    const valueId =
      pickString(rec, "value_id") ?? pickString(rec, "option_value");
    if (optionId && valueId) {
      options.push({ option_id: optionId, value_id: valueId });
    }
  }
  return options.length ? options : undefined;
}

/** Read cart command from a Teia `data: { done, action?, intent? }` object. */
export function extractTeiaCartOpFromSseObject(
  obj: Record<string, unknown>,
): TeiaCartOp | null {
  if (obj.done !== true) return null;
  const fromAction = unwrapCartOp(obj.action);
  if (fromAction) return fromAction;
  return unwrapCartOp(obj.intent);
}

async function fetchCartLineItems(
  cartId: string,
): Promise<{ item_id: number; sku: string; qty: number }[]> {
  const r = await fetch(`/api/cart?cartId=${encodeURIComponent(cartId)}`, {
    cache: "no-store",
  });
  if (!r.ok) return [];
  const data = (await r.json()) as {
    items?: { item_id: number; sku: string; qty: number }[];
  };
  return data.items ?? [];
}

function findLineBySku(
  items: { item_id: number; sku: string; qty: number }[],
  sku: string,
): { item_id: number; sku: string; qty: number } | null {
  const u = sku.toUpperCase();
  for (const it of items) {
    if (it.sku && it.sku.toUpperCase() === u) return it;
  }
  return null;
}

export async function applyTeiaCartAction(
  op: TeiaCartOp,
  deps: {
    cartId: string;
    addBySku: (
      sku: string,
      qty: number,
      options?: AddToCartOptions,
    ) => Promise<void>;
    updateQty: (itemId: number, sku: string, qty: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
  },
): Promise<void> {
  const { cartId, addBySku, updateQty, removeItem } = deps;

  if (op.type === "add_to_cart") {
    if (!op.sku) return;
    const customOptions: MagentoCustomOptionSelection[] | undefined =
      op.options?.map((o) => ({
        option_id: o.option_id,
        option_value: o.value_id,
      }));
    await addBySku(
      op.sku,
      op.qty || 1,
      customOptions?.length ? { customOptions } : undefined,
    );
    return;
  }

  if (!op.sku) return;
  const items = await fetchCartLineItems(cartId);
  const line = findLineBySku(items, op.sku);
  if (!line) return;

  if (op.type === "remove_from_cart") {
    await removeItem(line.item_id);
    return;
  }

  if (op.type === "update_cart") {
    await updateQty(line.item_id, line.sku, op.qty || 1);
  }
}
