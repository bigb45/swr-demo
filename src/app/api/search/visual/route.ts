/**
 * POST /api/search/visual
 *
 * Sends an image to Teia `POST /api/v1/chat/image` (SSE, same event shape as
 * `/api/v1/chat/stream`), concatenates streamed text, parses SKU hints, and
 * resolves products from Magento.
 */

import type { NextRequest } from "next/server";
import { parseCopilotAssistantMessage } from "@/lib/copilot-parse";
import { consumeSseBody, extractCompletionText } from "@/lib/copilot-stream";
import { resolveMagentoProductBySkuFlexible } from "@/lib/magento";
import { buildTeiaImageChatPayload, teiaAiBaseUrl } from "@/lib/teia-chat-proxy";
import type { MagentoProduct } from "@/types/magento";

const MAX_SKUS = 12;

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => null);
  const built = await buildTeiaImageChatPayload(raw);
  if (!built.ok) {
    return Response.json({ error: built.error }, { status: built.status });
  }

  const base = teiaAiBaseUrl();
  const res = await fetch(`${base}/api/v1/chat/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(built.payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return Response.json(
      {
        items: [] as MagentoProduct[],
        error: text?.slice(0, 500) || "upstream error",
      },
      { status: 502 },
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  let reply = "";

  if (contentType.includes("text/event-stream") && res.body) {
    let streamError: string | null = null;
    await consumeSseBody(
      res,
      (frag) => {
        reply += frag;
      },
      (obj) => {
        const err = obj.error;
        if (typeof err === "string" && err.trim()) streamError = err.trim();
      },
    );
    if (streamError) {
      return Response.json({
        items: [] as MagentoProduct[],
        error: streamError,
      });
    }
  } else {
    const text = await res.text().catch(() => "");
    reply = extractCompletionText(
      (() => {
        try {
          return JSON.parse(text) as unknown;
        } catch {
          return text;
        }
      })(),
    );
    if (!reply) reply = text;
  }

  const parsed = parseCopilotAssistantMessage(reply);
  const skuCandidates = parsed.skus.slice(0, MAX_SKUS);

  const settled = await Promise.all(
    skuCandidates.map((sku) => resolveMagentoProductBySkuFlexible(sku)),
  );

  const items = settled.filter((p): p is MagentoProduct => p != null);

  return Response.json(
    {
      items,
      assistant_note: parsed.displayText.trim().slice(0, 800) || null,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
