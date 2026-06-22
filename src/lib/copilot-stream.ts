/**
 * Best-effort parsing for Teia / generic SSE and JSON replies.
 */

export interface ParsedTeiaStructuredResponse {
  displayText: string;
  skus: string[];
  suppressAssistantNote: boolean;
}

function fragmentFromParsedObject(data: Record<string, unknown>): string {
  const pickScalar = (): string => {
    for (const k of [
      "content",
      "text",
      "message",
      "delta",
      "chunk",
      "token",
    ]) {
      const v = data[k];
      if (typeof v === "string") return v;
    }
    return "";
  };

  const s = pickScalar();
  if (s) return s;

  const choices = data["choices"];
  if (Array.isArray(choices) && choices[0] && typeof choices[0] === "object") {
    const c0 = choices[0] as Record<string, unknown>;
    const delta = c0["delta"];
    if (delta && typeof delta === "object") {
      const d = delta as Record<string, unknown>;
      if (typeof d["content"] === "string") return d.content;
      if (typeof d["text"] === "string") return d.text;
    }
    if (typeof c0["text"] === "string") return c0.text as string;
  }

  const response = data["response"];
  if (typeof response === "string") return response;

  return "";
}

/** Extract a display string from SSE `data:` JSON or plain payloads. */
export function extractSsePayloadText(raw: string): string {
  const t = raw.trim();
  if (!t || t === "[DONE]") return "";
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(t);
      if (typeof parsed === "string") return parsed;
      if (parsed && typeof parsed === "object") {
        return fragmentFromParsedObject(parsed as Record<string, unknown>);
      }
      return "";
    } catch {
      return t;
    }
  }
  return t;
}

/** Walk common keys for REST JSON completions. */
export function extractCompletionText(data: unknown): string {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";

  const o = data as Record<string, unknown>;
  for (const k of ["reply", "answer", "message", "content", "text"]) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v;
  }

  const nested =
    typeof o.response === "object" && o.response !== null
      ? extractCompletionText(o.response)
      : "";
  if (nested) return nested;

  const fromShape = fragmentFromParsedObject(o);
  if (fromShape) return fromShape;

  return "";
}

function pushSkuUnique(sku: string, bucket: string[], seen: Set<string>) {
  const s = sku.trim();
  if (!s || s.length < 2 || seen.has(s)) return;
  seen.add(s);
  bucket.push(s);
}

function collectStructuredSkus(
  value: unknown,
  bucket: string[],
  seen: Set<string>,
  parentKey = "",
) {
  if (typeof value === "string") {
    if (/\bskus?\b|product/i.test(parentKey)) {
      pushSkuUnique(value, bucket, seen);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectStructuredSkus(item, bucket, seen, parentKey);
    return;
  }

  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (/^(sku|product_sku|productSku)$/i.test(key) && typeof child === "string") {
      pushSkuUnique(child, bucket, seen);
      continue;
    }

    collectStructuredSkus(child, bucket, seen, key);
  }
}

function extractStructuredText(data: Record<string, unknown>): string {
  for (const key of [
    "message",
    "reply",
    "assistant_text",
    "text",
    "content",
    "summary",
  ]) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/**
 * Reads Teia's terminal SSE `response: StructuredResponse` object. Product lists
 * intentionally suppress assistant prose so UI-rendered product rows stay in
 * charge of what the shopper sees.
 */
export function parseTeiaStructuredResponse(
  response: unknown,
): ParsedTeiaStructuredResponse {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return { displayText: "", skus: [], suppressAssistantNote: false };
  }

  const data = response as Record<string, unknown>;
  const type = typeof data.type === "string" ? data.type : "";
  const skus: string[] = [];
  collectStructuredSkus(data, skus, new Set());

  return {
    displayText: extractStructuredText(data),
    skus,
    suppressAssistantNote: type === "product_list",
  };
}

/**
 * Reads the new product reply envelope `{ reply, intent, action, response }`
 * (stream `done` event or non-stream JSON body). Tolerates being handed the
 * inner `response` object directly. Returns the structured SKUs (from
 * `response.items[].sku`) plus a display message, or null when neither present.
 */
export function extractStructuredProductReply(
  envelope: unknown,
): { message: string; skus: string[] } | null {
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
    return null;
  }
  const o = envelope as Record<string, unknown>;
  const response =
    o.response && typeof o.response === "object" ? o.response : o;
  const parsed = parseTeiaStructuredResponse(response);

  if (parsed.skus.length === 0 && !parsed.displayText) return null;

  const replyText =
    parsed.displayText ||
    (typeof o.reply === "string" ? o.reply.trim() : "");

  return { message: replyText, skus: parsed.skus };
}

/**
 * Incrementally read `text/event-stream` from a fetch Response body.
 *
 * Tracks the SSE `event:` name across the lines of one event so progress
 * frames (`tool_call`, `artifact`, `delta`, …) can be mapped to a status
 * phase. The event name resets on the blank line that terminates each event.
 */
export async function consumeSseBody(
  res: Response,
  onChunk: (s: string) => void,
  /** Called for each `data:` line that parses as a JSON object (e.g. Teia `done` + `action`). */
  onDataObject?: (obj: Record<string, unknown>, eventName: string) => void,
): Promise<void> {
  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("No readable stream body");
  }
  const dec = new TextDecoder();
  let buf = "";
  let currentEvent = "";

  const handleLine = (line: string) => {
    if (line === "") {
      currentEvent = "";
      return;
    }
    if (line.startsWith("event:")) {
      currentEvent = line.slice(6).trim();
      return;
    }
    if (!line.startsWith("data:")) return;
    const raw = line.slice(5).trim();
    if (onDataObject && raw.startsWith("{")) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          onDataObject(parsed as Record<string, unknown>, currentEvent);
        }
      } catch {
        /** not JSON */
      }
    }
    const frag = extractSsePayloadText(raw);
    if (frag) onChunk(frag);
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      for (;;) {
        const ix = buf.indexOf("\n");
        if (ix === -1) break;
        let line = buf.slice(0, ix);
        buf = buf.slice(ix + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        handleLine(line);
      }
    }
    if (buf.trim()) handleLine(buf.trim());
  } finally {
    reader.releaseLock();
  }
}

export type CopilotStatus =
  | "idle"
  | "thinking"
  | "searching"
  | "findingProducts"
  | "updatingCart"
  | "analyzingImage"
  | "working";

function readToolName(obj: Record<string, unknown>): string {
  for (const key of ["name", "tool", "tool_name", "function"]) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim().toLowerCase();
  }
  return "";
}

/**
 * Map a Teia SSE progress frame to a UI status phase. Works whether the type
 * is on the `event:` line or implied by the data payload shape. Returns the
 * next status, or `null` when the frame carries no phase signal.
 */
export function deriveCopilotStatus(
  eventName: string,
  obj: Record<string, unknown>,
): CopilotStatus | null {
  const evt = eventName.trim().toLowerCase();

  // Answer tokens streaming -> the reply is now visible, clear the status row.
  if (evt === "delta" || typeof obj.text === "string") return "idle";

  // Product results arrived.
  if (
    evt === "artifact" ||
    obj.type === "product_list" ||
    Array.isArray((obj as { items?: unknown }).items)
  ) {
    return "findingProducts";
  }

  // A tool is being invoked.
  const looksLikeToolCall =
    evt === "tool_call" ||
    evt === "tool" ||
    (typeof obj.name === "string" && "arguments" in obj);
  if (looksLikeToolCall) {
    const tool = readToolName(obj);
    if (/cart/.test(tool)) return "updatingCart";
    if (/search|find|lookup|catalog|product/.test(tool)) return "searching";
    return "working";
  }

  return null;
}
