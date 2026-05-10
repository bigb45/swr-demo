/**
 * Service case attachment upload — Magento / ERP contract.
 *
 * When the storefront **posts** multipart files to
 * `POST /rest/{path}` (default path `V1/swr-service-case/attachments`),
 * Magento should persist blobs (or hand off to ERP) and return stable ids
 * that can be attached to a subsequent RMA / case creation payload.
 *
 * **Request**
 * - `Authorization: Bearer <customer token>`
 * - `Content-Type: multipart/form-data`
 * - One or more parts named **`files`** (repeat the same field name per file),
 *   identical to what `submitServiceCase` receives from `NewCaseForm` (`name="attachments"` on
 *   the client is re-posted server-side as `files` here).
 *
 * **Success (200)** — either shape:
 * ```json
 * { "items": [ { "id": "att-uuid", "file_name": "photo.jpg" } ] }
 * ```
 * or a single:
 * ```json
 * { "id": "att-uuid", "file_name": "photo.jpg" }
 * ```
 *
 * The storefront matches returned rows to the original file list **by order**
 * (same order as appended to `FormData`).
 *
 * **Errors** — `401` / `403` / `413` / `422` as usual; on any non-2xx the
 * server action **falls back** to filename-only metadata (existing demo behaviour).
 *
 * Configure the relative REST path (after `/rest/`) with
 * `SWR_SERVICE_ATTACHMENT_REST_PATH` (default `V1/swr-service-case/attachments`).
 */

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";

export const SERVICE_ATTACHMENT_REST_PATH =
  process.env.SWR_SERVICE_ATTACHMENT_REST_PATH ??
  "V1/swr-service-case/attachments";

export interface UploadedAttachmentRef {
  id: string;
  fileName: string;
}

function parseUploadResponse(
  raw: string,
  fallbackNames: string[],
): UploadedAttachmentRef[] {
  if (!raw.trim()) return [];
  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    return [];
  }
  if (!body || typeof body !== "object") return [];

  const items: unknown[] = [];
  const o = body as Record<string, unknown>;
  if (Array.isArray(o.items)) {
    for (const x of o.items) items.push(x);
  } else if (o.id != null) {
    items.push(o);
  }
  const out: UploadedAttachmentRef[] = [];
  let i = 0;
  for (const row of items) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = r.id != null ? String(r.id) : "";
    if (!id) continue;
    const fileName =
      r.file_name != null
        ? String(r.file_name)
        : r.fileName != null
          ? String(r.fileName)
          : fallbackNames[i] ?? "file";
    out.push({ id, fileName });
    i++;
  }
  return out;
}

/**
 * Posts files to Magento; returns **empty** when the endpoint is missing or errors.
 */
export async function uploadServiceCaseAttachments(
  customerToken: string,
  files: File[],
): Promise<UploadedAttachmentRef[]> {
  if (files.length === 0) return [];

  const path = SERVICE_ATTACHMENT_REST_PATH.replace(/^\//, "");
  const fd = new FormData();
  for (const f of files) {
    fd.append("files", f, f.name);
  }

  try {
    const res = await fetch(`${MAGENTO}/rest/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: fd,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const raw = await res.text();
    const names = files.map((f) => f.name);
    return parseUploadResponse(raw, names);
  } catch {
    return [];
  }
}
