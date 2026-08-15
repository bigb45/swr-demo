/**
 * POST /api/erp/products
 *
 * Body: `{ skus: string[] }` (capped at 50).
 * Returns enventa ERP net prices keyed by SKU for the logged-in shopper.
 * Prices come from the same Teia Catalog Bridge erpprice endpoint as the
 * configurable variant picker (`/api/erp-price`).
 *
 * Discriminated top-level state:
 * - `no_customer` — guest or account without enventa_customer_id
 * - `ok` — customer resolved; `items` may still omit SKUs with no ERP price
 */

import {
  fetchErpDataForSkus,
  resolveEnventaCustomerId,
} from "@/lib/erp";
import type { ErpSkuData } from "@/lib/erp-shared";

const MAX_SKUS = 50;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const rawSkus =
    body &&
    typeof body === "object" &&
    Array.isArray((body as { skus?: unknown }).skus)
      ? ((body as { skus: unknown[] }).skus)
      : null;

  if (!rawSkus) {
    return Response.json({ error: "skus_required" }, { status: 400 });
  }

  const skus = rawSkus
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, MAX_SKUS);

  const enventaId = await resolveEnventaCustomerId();
  if (!enventaId) {
    return Response.json(
      {
        state: "no_customer" as const,
        items: {} as Record<string, ErpSkuData>,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  if (skus.length === 0) {
    return Response.json(
      {
        state: "ok" as const,
        items: {} as Record<string, ErpSkuData>,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const map = await fetchErpDataForSkus(skus, enventaId);
  const items: Record<string, ErpSkuData> = {};
  for (const [sku, data] of map) {
    items[sku] = data;
  }

  return Response.json(
    { state: "ok" as const, items },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
