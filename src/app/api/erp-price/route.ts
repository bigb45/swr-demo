/**
 * GET /api/erp-price?sku=…&qty=…
 *
 * Server proxy for Teia Catalog Bridge live ERP pricing.
 * Resolves the enventa customer from the verified session cookie and never
 * forwards a client-supplied `X-Enventa-Customer-Id`.
 */

import { fetchLiveErpPrice } from "@/lib/erp-price";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sku = url.searchParams.get("sku")?.trim() ?? "";
  const qtyRaw = Number(url.searchParams.get("qty") ?? "1");
  const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;

  if (!sku) {
    return Response.json(
      { state: "error", error: "missing_sku", sku: "", qty },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await fetchLiveErpPrice(sku, qty);

  return Response.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
