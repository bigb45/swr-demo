/**
 * POST /api/auth/register
 * Body: { firstName, lastName, email, password }
 * Creates a Magento customer account. When "Require Admin Approval" is enabled
 * in Magento, the account stays inactive until manually approved by SWR staff.
 */

import { NextRequest } from "next/server";
import { extractMagentoMessage } from "@/lib/checkout";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const { firstName, lastName, email, password } = await req.json();

  if (!firstName || !lastName || !email || !password) {
    return Response.json(
      { error: "All fields are required" },
      { status: 400 },
    );
  }

  const res = await fetch(`${MAGENTO}/rest/V1/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        firstname: firstName,
        lastname: lastName,
        email,
        website_id: 1,
        store_id: 1,
      },
      password,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return Response.json(
      { error: extractMagentoMessage(body, "Registration failed. Please try again.") },
      { status: res.status },
    );
  }

  return Response.json({ ok: true, pendingApproval: true }, { status: 201 });
}
