/**
 * Best-effort parsing for Teia / generic SSE and JSON replies.
 */

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
