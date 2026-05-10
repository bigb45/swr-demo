/**
 * Parses assistant payloads that may blend prose with structured product refs.
 *
 * Supported shapes (upstream can adopt any):
 * - Trailing `<<<COPILOT_JSON>>>{...}` or `<<<COPILOT>>>{...}` with optional
 *   `assistant_text`, `message`, `reply`, `widgets: [{ sku }]`, `products: string[]`
 * - A whole JSON body starting with `{` that includes known keys
 * - Fenced ```json / ```copilot-widgets block
 * - Fallback: SKU tokens in prose (`SKU: 6-100103`, `| SKU: 6-100103 |`)
 */

export interface ParsedAssistantBody {
  displayText: string;
  /** Unique SKUs in first-seen order. */
  skus: string[];
}

const TRAIL_MARKERS = [
  /\n?<<<COPILOT_JSON>>>\s*(\{[\s\S]*)\s*$/i,
  /\n?<<<COPILOT>>>\s*(\{[\s\S]*)\s*$/i,
];

function pushSkuUnique(sku: string, bucket: string[], seen: Set<string>) {
  const s = sku.trim();
  if (!s || s.length < 2 || seen.has(s)) return;
  seen.add(s);
  bucket.push(s);
}

function skusFromWidgets(
  widgets: unknown,
  bucket: string[],
  seen: Set<string>,
) {
  if (!Array.isArray(widgets)) return;
  for (const w of widgets) {
    if (w && typeof w === "object" && typeof (w as { sku?: unknown }).sku === "string") {
      pushSkuUnique((w as { sku: string }).sku, bucket, seen);
    }
  }
}

function readStructuredObject(data: Record<string, unknown>): {
  text: string;
  skus: string[];
} {
  const bucket: string[] = [];
  const seen = new Set<string>();

  const msg =
    (typeof data.message === "string" && data.message) ||
    (typeof data.reply === "string" && data.reply) ||
    (typeof data.assistant_text === "string" && data.assistant_text) ||
    "";

  skusFromWidgets(data.widgets, bucket, seen);
  skusFromWidgets(data.copilot_widgets, bucket, seen);

  const products = data.products;
  if (Array.isArray(products)) {
    for (const p of products) {
      if (typeof p === "string") pushSkuUnique(p, bucket, seen);
    }
  }

  return { text: msg.trim(), skus: bucket };
}

function tryParseStructuredJson(slice: string): {
  text: string;
  skus: string[];
} | null {
  const trimmed = slice.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    const parsed: unknown = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      const bucket: string[] = [];
      const seen = new Set<string>();
      for (const item of parsed) {
        if (typeof item === "string") pushSkuUnique(item, bucket, seen);
        else if (item && typeof item === "object" && "sku" in item) {
          const sku = (item as { sku: unknown }).sku;
          if (typeof sku === "string") pushSkuUnique(sku, bucket, seen);
        }
      }
      return { text: "", skus: bucket };
    }

    if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>;
      if (
        "widgets" in o ||
        "products" in o ||
        "assistant_text" in o ||
        "message" in o ||
        "reply" in o ||
        "copilot_widgets" in o
      ) {
        return readStructuredObject(o);
      }
    }
  } catch {
    return null;
  }
  return null;
}

function stripFencedBlocks(raw: string): { text: string; skus: string[] } {
  const skus: string[] = [];
  const seen = new Set<string>();
  let text = raw;
  const fence =
    /```(?:json|copilot-widgets|copilot)?\s*\n([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  const regex = new RegExp(fence.source, fence.flags);
  while ((m = regex.exec(raw)) !== null) {
    const inner = m[1]?.trim() ?? "";
    const parsed = tryParseStructuredJson(inner);
    if (parsed) {
      for (const s of parsed.skus) pushSkuUnique(s, skus, seen);
    }
    text = text.replace(m[0], "\n");
  }
  return { text: text.replace(/\n{3,}/g, "\n\n").trim(), skus };
}

function extractSkusFromProse(text: string): string[] {
  const bucket: string[] = [];
  const seen = new Set<string>();
  const patterns = [
    /\bSKU\s*[#:]?\s*([A-Za-z0-9._-]+)/gi,
    /\|\s*SKU:\s*([^\s|]+)/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text)) !== null) {
      if (m[1]) pushSkuUnique(m[1], bucket, seen);
    }
  }
  // #region agent log
  fetch("http://127.0.0.1:7547/ingest/12ce9b7c-5bb7-461a-816f-4c8be1c9bd1b", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "074c39",
    },
    body: JSON.stringify({
      sessionId: "074c39",
      location: "copilot-parse.ts:extractSkusFromProse",
      message: "prose sku extraction",
      data: {
        bucket,
        proseSample: text.slice(0, 220),
        patternSources: patterns.map((p) => p.source),
      },
      timestamp: Date.now(),
      hypothesisId: "H1",
    }),
  }).catch(() => {});
  // #endregion
  return bucket;
}

function mergeSkusOrdered(base: string[], extra: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of base) {
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  for (const s of extra) {
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export function parseCopilotAssistantMessage(rawInput: string): ParsedAssistantBody {
  let raw = rawInput.trim();
  let structuredSkus: string[] = [];
  let proseOverride = "";

  for (const re of TRAIL_MARKERS) {
    const match = raw.match(re);
    if (match?.[1]) {
      const parsed = tryParseStructuredJson(match[1]);
      if (parsed) {
        structuredSkus = mergeSkusOrdered(structuredSkus, parsed.skus);
        if (parsed.text) proseOverride = parsed.text.trim();
      }
      raw = raw.slice(0, match.index).trim();
      break;
    }
  }

  const fenced = stripFencedBlocks(raw);
  raw = fenced.text || raw;
  structuredSkus = mergeSkusOrdered(structuredSkus, fenced.skus);

  if (raw.startsWith("{") && structuredSkus.length === 0) {
    const whole = tryParseStructuredJson(raw);
    if (whole && (whole.skus.length > 0 || whole.text)) {
      raw = whole.text || "";
      structuredSkus = mergeSkusOrdered(structuredSkus, whole.skus);
    }
  }

  const displayBase = (proseOverride || raw).trim();

  const skus =
    structuredSkus.length > 0 ? structuredSkus : extractSkusFromProse(displayBase);

  // #region agent log
  fetch("http://127.0.0.1:7547/ingest/12ce9b7c-5bb7-461a-816f-4c8be1c9bd1b", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "074c39",
    },
    body: JSON.stringify({
      sessionId: "074c39",
      location: "copilot-parse.ts:parseCopilotAssistantMessage",
      message: "final parse",
      data: {
        structuredCount: structuredSkus.length,
        usedProseFallback: structuredSkus.length === 0,
        skuCount: skus.length,
        skus,
        displaySample: displayBase.slice(0, 220),
      },
      timestamp: Date.now(),
      hypothesisId: "H2",
    }),
  }).catch(() => {});
  // #endregion

  return {
    displayText: displayBase,
    skus,
  };
}
