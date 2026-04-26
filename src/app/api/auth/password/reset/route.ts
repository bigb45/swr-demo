/**
 * POST /api/auth/password/reset
 * Body: { email, resetToken, newPassword }
 *
 * Finalizes the Magento password-reset flow. Called from the
 * `/account/reset-password` page after the user clicks the token link in the
 * reset email.
 */

import { NextRequest } from "next/server";
import { extractMagentoMessage } from "@/lib/checkout";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  const email = asString(body?.email);
  const resetToken = asString(body?.resetToken);
  const newPassword = asString(body?.newPassword);

  if (!email || !resetToken || !newPassword) {
    return Response.json(
      { error: "email, resetToken, and newPassword are required" },
      { status: 400 },
    );
  }

  const res = await fetch(`${MAGENTO}/rest/V1/customers/resetPassword`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, resetToken, newPassword }),
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return Response.json(
      { error: extractMagentoMessage(data, "Reset link is invalid or has expired") },
      { status: res.status },
    );
  }

  return Response.json({ ok: true });
}
