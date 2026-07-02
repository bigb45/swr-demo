/**
 * Maps Teia's `GET /api/v1/chat/sessions/{session_id}` payload
 * (`SessionMessagesResponse`) into the storefront `CopilotMessage[]` used to
 * replay a conversation after a page reload.
 *
 * History is display-only: it carries no image bytes and no client-side cart
 * side-effects, so restored user turns show text only and assistant turns
 * render product cards solely from the typed `product_list` envelope.
 */

import type { CopilotMessage } from "@/components/copilot/types";
import {
  extractSuggestedPrompts,
  extractNeedsOptions,
} from "@/lib/copilot-stream";

interface TeiaProductItem {
  sku?: unknown;
}

interface TeiaStructuredResponse {
  type?: unknown;
  message?: unknown;
  items?: unknown;
}

interface TeiaUiMessage {
  role?: unknown;
  content?: unknown;
  reply?: unknown;
  response?: unknown;
}

export interface TeiaSessionMessagesResponse {
  session_id?: unknown;
  messages?: unknown;
  meta?: unknown;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function productSkusFromResponse(response: unknown): string[] {
  if (!response || typeof response !== "object") return [];
  const r = response as TeiaStructuredResponse;
  if (r.type !== "product_list" || !Array.isArray(r.items)) return [];
  const skus: string[] = [];
  const seen = new Set<string>();
  for (const item of r.items as TeiaProductItem[]) {
    const sku = asString(item?.sku).trim();
    if (sku && !seen.has(sku)) {
      seen.add(sku);
      skus.push(sku);
    }
  }
  return skus;
}

/**
 * Returns the restored transcript oldest-first. `baseTime` anchors synthetic
 * timestamps (the API carries none) so each turn renders a stable, increasing
 * clock value.
 */
export function mapSessionHistory(
  payload: unknown,
  baseTime: number = Date.now(),
): CopilotMessage[] {
  if (!payload || typeof payload !== "object") return [];
  const raw = (payload as TeiaSessionMessagesResponse).messages;
  if (!Array.isArray(raw)) return [];

  const out: CopilotMessage[] = [];
  const total = raw.length;

  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const m = entry as TeiaUiMessage;
    const createdAt = baseTime - (total - index) * 1000;

    if (m.role === "user") {
      const content = asString(m.content);
      out.push({
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt,
      });
      return;
    }

    if (m.role === "assistant") {
      const response = m.response;
      const structuredMessage =
        response && typeof response === "object"
          ? asString((response as TeiaStructuredResponse).message).trim()
          : "";
      const content = structuredMessage || asString(m.reply).trim();
      const widgetSkus = productSkusFromResponse(response);
      const suggestedPrompts = extractSuggestedPrompts(entry);
      const optionsRequest = extractNeedsOptions(entry);
      out.push({
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        streaming: false,
        widgetSkus: widgetSkus.length > 0 ? widgetSkus : undefined,
        suggestedPrompts:
          suggestedPrompts.length > 0 ? suggestedPrompts : undefined,
        optionsRequest: optionsRequest ?? undefined,
        createdAt,
      });
    }
  });

  return out;
}
