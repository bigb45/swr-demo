import { cookies } from "next/headers";
import { fetchCustomerMe } from "@/lib/checkout";

const DEFAULT_TEIA_AI_BASE = "http://46.224.237.247:8000";

/** ~4 MiB decoded payload guard for optional multimodal fields */
const MAX_IMAGE_DECODED_BYTES = 4 * 1024 * 1024;

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function approxDecodedBase64Bytes(b64: string): number {
  const clean = b64.replace(/\s/g, "");
  const pad = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((clean.length * 3) / 4) - pad);
}

export function teiaAiBaseUrl(): string {
  return (process.env.TEIA_AI_BASE_URL ?? DEFAULT_TEIA_AI_BASE).replace(
    /\/$/,
    "",
  );
}

/**
 * Validates Teia chat POST bodies and enriches with Magento `customer_id` when
 * a valid storefront customer session cookie is present and no guest `cart_id`
 * was supplied — so Teia can still personalize *non-cart* flows. When
 * `cart_id` is set, `customer_id` is intentionally omitted so cart tools target
 * the storefront guest quote (never trusts client-supplied customer_id).
 */
export async function buildTeiaChatPayload(
  raw: unknown,
): Promise<
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; status: number; error: string }
> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, status: 400, error: "Invalid JSON body" };
  }

  const o = raw as Record<string, unknown>;
  const session_id =
    typeof o.session_id === "string" ? o.session_id.trim() : "";
  const message = typeof o.message === "string" ? o.message.trim() : "";
  if (!session_id || !message) {
    return {
      ok: false,
      status: 400,
      error: "session_id and message are required strings",
    };
  }

  const payload: Record<string, unknown> = { session_id, message };

  const imageRaw =
    typeof o.image_base64 === "string" ? o.image_base64.trim() : "";
  if (imageRaw) {
    const normalized = imageRaw.replace(/\s/g, "");
    const decodedApprox = approxDecodedBase64Bytes(normalized);
    if (decodedApprox > MAX_IMAGE_DECODED_BYTES) {
      return {
        ok: false,
        status: 413,
        error: "Image too large (max ~4 MB)",
      };
    }
    if (decodedApprox < 32) {
      return {
        ok: false,
        status: 400,
        error: "Invalid image payload",
      };
    }
    let mime =
      typeof o.image_mime_type === "string"
        ? o.image_mime_type.trim().toLowerCase()
        : "image/jpeg";
    if (!ALLOWED_IMAGE_MIME.has(mime)) {
      return {
        ok: false,
        status: 400,
        error: "Unsupported image type",
      };
    }
    /**
     * Teia OpenAPI v1.0 documents text-only bodies; newer deployments accept
     * optional vision fields — forward both keys so upstream can ignore safely.
     */
    payload.image_base64 = normalized;
    payload.image_mime_type = mime;
  }

  if (o.cart_id != null) {
    if (typeof o.cart_id === "string") {
      const t = o.cart_id.trim();
      if (t) payload.cart_id = t;
    } else if (typeof o.cart_id === "number" && Number.isFinite(o.cart_id)) {
      payload.cart_id = o.cart_id;
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  const hasGuestCartId =
    payload.cart_id != null &&
    String(
      typeof payload.cart_id === "number" ? payload.cart_id : payload.cart_id,
    ).trim() !== "";

  // Storefront cart UI is always the masked *guest* quote (`/guest-carts/...`).
  // If we also send `customer_id`, Teia typically mutates the customer's active
  // quote instead — a different Magento cart than `swr_cart_id`, so lines
  // "succeed" but the Next.js cart stays empty.
  if (token && !hasGuestCartId) {
    const me = await fetchCustomerMe(token);
    if (me?.id != null) payload.customer_id = me.id;
  }

  return { ok: true, payload };
}

/**
 * Validates Teia `POST /api/v1/chat/image` bodies (vision + SSE).
 * Upstream expects `image_media_type`; clients may send `image_mime_type`.
 */
export async function buildTeiaImageChatPayload(
  raw: unknown,
): Promise<
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; status: number; error: string }
> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, status: 400, error: "Invalid JSON body" };
  }

  const o = raw as Record<string, unknown>;
  const session_id =
    typeof o.session_id === "string" ? o.session_id.trim() : "";
  if (!session_id) {
    return { ok: false, status: 400, error: "session_id is required" };
  }

  const imageRaw =
    typeof o.image_base64 === "string" ? o.image_base64.trim() : "";
  if (!imageRaw) {
    return { ok: false, status: 400, error: "image_base64 is required" };
  }

  const normalized = imageRaw.replace(/\s/g, "");
  const decodedApprox = approxDecodedBase64Bytes(normalized);
  if (decodedApprox > MAX_IMAGE_DECODED_BYTES) {
    return {
      ok: false,
      status: 413,
      error: "Image too large (max ~4 MB)",
    };
  }
  if (decodedApprox < 32) {
    return {
      ok: false,
      status: 400,
      error: "Invalid image payload",
    };
  }

  const mimeFromMime =
    typeof o.image_mime_type === "string" ? o.image_mime_type.trim() : "";
  const mimeFromMedia =
    typeof o.image_media_type === "string"
      ? o.image_media_type.trim()
      : "";
  let mime = (mimeFromMime || mimeFromMedia || "image/jpeg").toLowerCase();
  if (!ALLOWED_IMAGE_MIME.has(mime)) {
    return {
      ok: false,
      status: 400,
      error: "Unsupported image type",
    };
  }

  const payload: Record<string, unknown> = {
    session_id,
    image_base64: normalized,
    image_media_type: mime,
  };

  if (o.cart_id != null) {
    if (typeof o.cart_id === "string") {
      const t = o.cart_id.trim();
      if (t) payload.cart_id = t;
    } else if (typeof o.cart_id === "number" && Number.isFinite(o.cart_id)) {
      payload.cart_id = o.cart_id;
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  const hasGuestCartId =
    payload.cart_id != null &&
    String(
      typeof payload.cart_id === "number" ? payload.cart_id : payload.cart_id,
    ).trim() !== "";

  if (token && !hasGuestCartId) {
    const me = await fetchCustomerMe(token);
    if (me?.id != null) payload.customer_id = me.id;
  }

  return { ok: true, payload };
}
