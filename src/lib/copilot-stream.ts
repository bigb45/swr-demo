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

/** Incrementally read `text/event-stream` from a fetch Response body. */
export async function consumeSseBody(
  res: Response,
  onChunk: (s: string) => void,
  /** Called for each `data:` line that parses as a JSON object (e.g. Teia `done` + `action`). */
  onDataObject?: (obj: Record<string, unknown>) => void,
): Promise<void> {
  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("No readable stream body");
  }
  const dec = new TextDecoder();
  let buf = "";

  const handleLine = (line: string) => {
    if (!line.startsWith("data:")) return;
    const raw = line.slice(5).trim();
    if (onDataObject && raw.startsWith("{")) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          onDataObject(parsed as Record<string, unknown>);
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
