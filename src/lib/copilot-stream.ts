/**
 * Best-effort parsing for Teia / generic SSE and JSON replies.
 */

export interface ParsedTeiaStructuredResponse {
  displayText: string;
  skus: string[];
  orders: CopilotOrderRow[];
  suppressAssistantNote: boolean;
}

/** One row of a Teia `order_list` artifact (order-history reply). */
export interface CopilotOrderRow {
  orderNumber: string;
  date?: string;
  total?: string;
  status?: string;
}

/** One backend-supplied follow-up chip: `short` is the label, `expanded` the prompt sent on tap. */
export interface CopilotSuggestedPrompt {
  short: string;
  expanded: string;
}

/** One selectable value inside a required-option group (Teia `needs_options`). */
export interface CopilotOptionValue {
  valueId: string;
  label: string;
  /** Pre-formatted surcharge string straight from the backend (e.g. "$3.00"), if any. */
  price?: string;
}

/** A required customizable-option group the shopper must resolve before add-to-cart. */
export interface CopilotOptionGroup {
  optionId: string;
  title: string;
  /** Magento option type: radio | drop_down | checkbox | multiple | field | area. */
  type: string;
  required: boolean;
  values: CopilotOptionValue[];
}

/** Teia `response.type === "needs_options"` envelope, normalized for the picker UI. */
export interface CopilotOptionsRequest {
  message: string;
  productName?: string;
  sku?: string;
  options: CopilotOptionGroup[];
}

function asTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Reads Teia's `needs_options` reply (a required-options gate returned when an
 * add-to-cart hits a configurable product). Tolerates the object being the
 * terminal `done` envelope or the inner `response` directly. Returns null when
 * the reply is not a needs_options gate or carries no usable option group.
 */
export function extractNeedsOptions(
  envelope: unknown,
): CopilotOptionsRequest | null {
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
    return null;
  }
  const o = envelope as Record<string, unknown>;
  const response =
    o.response && typeof o.response === "object" && !Array.isArray(o.response)
      ? (o.response as Record<string, unknown>)
      : o;

  if (response.type !== "needs_options") return null;
  const rawOptions = response.options;
  if (!Array.isArray(rawOptions)) return null;

  const options: CopilotOptionGroup[] = [];
  for (const rawOpt of rawOptions) {
    if (!rawOpt || typeof rawOpt !== "object") continue;
    const opt = rawOpt as Record<string, unknown>;
    const optionId = asTrimmed(opt.option_id) || asTrimmed(opt.id);
    const title = asTrimmed(opt.title) || asTrimmed(opt.label);
    if (!optionId || !title) continue;

    const type = (asTrimmed(opt.type) || "radio").toLowerCase();
    const required = opt.required === true || opt.is_require === true;

    const values: CopilotOptionValue[] = [];
    const rawValues = Array.isArray(opt.values) ? opt.values : [];
    for (const rawVal of rawValues) {
      if (!rawVal || typeof rawVal !== "object") continue;
      const v = rawVal as Record<string, unknown>;
      const valueId =
        asTrimmed(v.value_id) ||
        asTrimmed(v.option_type_id) ||
        asTrimmed(v.id);
      const label = asTrimmed(v.label) || asTrimmed(v.title);
      if (!valueId || !label) continue;
      const price = asTrimmed(v.price);
      values.push({ valueId, label, price: price || undefined });
    }

    options.push({ optionId, title, type, required, values });
  }

  if (options.length === 0) return null;

  const product =
    response.product && typeof response.product === "object"
      ? (response.product as Record<string, unknown>)
      : null;

  return {
    message: asTrimmed(response.message),
    productName:
      asTrimmed(response.product_name) ||
      (product ? asTrimmed(product.name) : "") ||
      undefined,
    sku:
      asTrimmed(response.sku) ||
      asTrimmed(response.product_sku) ||
      (product ? asTrimmed(product.sku) : "") ||
      undefined,
    options,
  };
}

/**
 * When Teia omits `sku` on `needs_options`, recover it from the sole product
 * card on the same assistant turn so the picker can add client-side.
 */
export function resolveOptionsRequestSku(
  request: CopilotOptionsRequest,
  widgetSkus?: string[],
): CopilotOptionsRequest {
  if (request.sku?.trim()) return request;
  const sole = widgetSkus?.length === 1 ? widgetSkus[0]?.trim() : "";
  if (sole) return { ...request, sku: sole };
  return request;
}

/**
 * Reads the `suggested_prompts: [{ short, expanded }]` array carried on the
 * terminal reply envelope (stream `done` event or non-stream JSON body).
 * Tolerates entries that only provide one of the two fields by mirroring it.
 */
export function extractSuggestedPrompts(
  envelope: unknown,
): CopilotSuggestedPrompt[] {
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
    return [];
  }
  const raw = (envelope as Record<string, unknown>).suggested_prompts;
  if (!Array.isArray(raw)) return [];

  const out: CopilotSuggestedPrompt[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const short = typeof r.short === "string" ? r.short.trim() : "";
    const expanded = typeof r.expanded === "string" ? r.expanded.trim() : "";
    const label = short || expanded;
    const text = expanded || short;
    if (label && text) out.push({ short: label, expanded: text });
  }
  return out;
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

function firstStringField(
  obj: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

/**
 * Normalize one raw `order_list` item into a display row. Order artifacts key
 * their fields differently across Teia/Magento shapes, so probe the common
 * aliases and keep only rows that carry an order identifier.
 */
function normalizeOrderRow(raw: unknown): CopilotOrderRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const orderNumber = firstStringField(o, [
    "order_number",
    "increment_id",
    "order_id",
    "number",
    "id",
  ]);
  if (!orderNumber) return null;

  const date = firstStringField(o, [
    "date",
    "created_at",
    "order_date",
    "placed_at",
  ]);
  const total = firstStringField(o, [
    "total_formatted",
    "grand_total_formatted",
    "total",
    "grand_total",
  ]);
  const status = firstStringField(o, ["status", "state"]);

  return {
    orderNumber,
    date: date || undefined,
    total: total || undefined,
    status: status || undefined,
  };
}

/** Read the rows of an `order_list` structured response (order-history reply). */
function collectStructuredOrders(data: Record<string, unknown>): CopilotOrderRow[] {
  if (data.type !== "order_list") return [];
  const rawItems = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.orders)
      ? data.orders
      : [];
  const rows: CopilotOrderRow[] = [];
  const seen = new Set<string>();
  for (const item of rawItems) {
    const row = normalizeOrderRow(item);
    if (row && !seen.has(row.orderNumber)) {
      seen.add(row.orderNumber);
      rows.push(row);
    }
  }
  return rows;
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
    return {
      displayText: "",
      skus: [],
      orders: [],
      suppressAssistantNote: false,
    };
  }

  const data = response as Record<string, unknown>;
  const type = typeof data.type === "string" ? data.type : "";
  const skus: string[] = [];
  collectStructuredSkus(data, skus, new Set());
  const orders = collectStructuredOrders(data);

  return {
    displayText: extractStructuredText(data),
    skus,
    orders,
    suppressAssistantNote: type === "product_list" || type === "order_list",
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
 * Order-history counterpart to {@link extractStructuredProductReply}. Reads a
 * Teia `order_list` envelope (`{ reply, response }` or the inner `response`
 * directly) and returns the order rows plus a display message, or null when the
 * reply carries no orders.
 */
export function extractStructuredOrderReply(
  envelope: unknown,
): { message: string; orders: CopilotOrderRow[] } | null {
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
    return null;
  }
  const o = envelope as Record<string, unknown>;
  const response =
    o.response && typeof o.response === "object" ? o.response : o;
  const parsed = parseTeiaStructuredResponse(response);

  if (parsed.orders.length === 0) return null;

  const replyText =
    parsed.displayText ||
    (typeof o.reply === "string" ? o.reply.trim() : "");

  return { message: replyText, orders: parsed.orders };
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
