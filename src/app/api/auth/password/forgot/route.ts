/**
 * POST /api/auth/password/forgot
 * Body: { email }
 *
 * Initiates the Magento password-reset flow. Magento dispatches a reset
 * email with a tokenized link; the user then lands on `/account/reset-password`.
 *
 * To preserve user enumeration resistance, the response is always `{ ok: true }`
 * regardless of whether the email exists in Magento.
 */

import { NextRequest } from "next/server";
import { extractMagentoMessage } from "@/lib/checkout";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = asString((body as Record<string, unknown> | null)?.email);
  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const res = await fetch(`${MAGENTO}/rest/V1/customers/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      template: "email_reset",
      websiteId: 1,
    }),
    cache: "no-store",
  });

  // Magento returns `true` for unknown emails too — we intentionally mirror
  // that opacity. Only surface an error for genuine backend failures.
  if (!res.ok && res.status >= 500) {
    const data = await res.json().catch(() => null);
    return Response.json(
      { error: extractMagentoMessage(data, "Unable to send reset email") },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
