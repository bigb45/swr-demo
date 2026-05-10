/**
 * POST /api/copilot/chat/stream
 *
 * Proxies JSON to Teia `POST /api/v1/chat/stream` and passes through the SSE
 * response body. Requires `session_id` and `message`; optionally forwards
 * `cart_id`. When a guest cart id is present, `customer_id` is omitted so Teia
 * mutates the same masked guest quote the storefront uses (`/guest-carts/...`),
 * not the customer's separate active quote.
 */

import { NextRequest } from "next/server";
import { buildTeiaChatPayload, teiaAiBaseUrl } from "@/lib/teia-chat-proxy";

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => null);
  const built = await buildTeiaChatPayload(raw);
  if (!built.ok) {
    return Response.json({ error: built.error }, { status: built.status });
  }

  const base = teiaAiBaseUrl();
  const res = await fetch(`${base}/api/v1/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(built.payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "upstream error");
    return Response.json({ error: text }, { status: 502 });
  }

  if (!res.body) {
    return Response.json({ error: "Empty upstream body" }, { status: 502 });
  }

  const contentType = res.headers.get("content-type") ?? "text/event-stream";
  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}
