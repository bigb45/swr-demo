export type CopilotAddIntent = {
  sku: string;
  /** Requested quantity to add (delta), not final line total. */
  qty: number;
};

/**
 * Best-effort parsing of "add N … SKU: xxx … cart" style messages so we can
 * reconcile the storefront guest cart when Teia does not mutate it via REST.
 */
export function parseAddToCartIntents(message: string): CopilotAddIntent[] {
  const text = message.trim();
  if (!text) return [];

  const intentCue =
    /\b(add|put|ajoute|ajouter|zum|leg\s+in)\b/i.test(text) ||
    /\b(cart|basket|warenkorb|panier|einkaufswagen)\b/i.test(text) ||
    /hinzuf/i.test(text);
  if (!intentCue) return [];

  const skuMatches = [
    ...text.matchAll(/\bsku\s*:\s*([A-Za-z0-9_.-]+)/gi),
  ];
  if (skuMatches.length === 0) return [];

  const addQtyMatch = text.match(/\badd\s+(\d+)\b/i);
  const nxQtyMatch = text.match(/\b(\d+)\s*[x×]\b/i);
  const qtyRaw = addQtyMatch
    ? Number.parseInt(addQtyMatch[1], 10)
    : nxQtyMatch
      ? Number.parseInt(nxQtyMatch[1], 10)
      : 1;
  const defaultQty =
    Number.isFinite(qtyRaw) && qtyRaw >= 1 ? qtyRaw : 1;

  const seen = new Set<string>();
  const intents: CopilotAddIntent[] = [];
  for (const m of skuMatches) {
    const sku = m[1]?.trim();
    if (!sku || seen.has(sku)) continue;
    seen.add(sku);
    intents.push({ sku, qty: defaultQty });
  }
  return intents;
}

export async function fetchCartSkuQtyMap(
  cartId: string,
): Promise<Map<string, number>> {
  const r = await fetch(
    `/api/cart?cartId=${encodeURIComponent(cartId)}`,
    { cache: "no-store" },
  );
  if (!r.ok) return new Map();
  const data = (await r.json()) as { items?: { sku: string; qty: number }[] };
  const map = new Map<string, number>();
  for (const item of data.items ?? []) {
    if (typeof item.sku === "string" && typeof item.qty === "number") {
      map.set(item.sku, item.qty);
    }
  }
  return map;
}

/**
 * Adds any missing quantity so each SKU's line qty increases by at least the
 * requested delta versus `before` (covers Teia claiming success without REST).
 */
export async function patchGuestCartShortfall(
  intents: CopilotAddIntent[],
  before: Map<string, number>,
  cartId: string,
  addBySku: (sku: string, qty: number) => Promise<void>,
): Promise<void> {
  if (intents.length === 0) return;
  const after = await fetchCartSkuQtyMap(cartId);
  for (const { sku, qty: expectedDelta } of intents) {
    const b = before.get(sku) ?? 0;
    const a = after.get(sku) ?? 0;
    const short = expectedDelta - (a - b);
    if (short > 0) {
      await addBySku(sku, short);
    }
  }
}
