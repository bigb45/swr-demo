/**
 * PUT /api/account/profile
 *
 * Body:
 *   {
 *     firstname: string,
 *     lastname: string,
 *     email: string,
 *     currentPassword?: string, // required when email changes and for password-change flow
 *     newPassword?: string,      // optional password-change
 *   }
 *
 * Handles two Magento calls in sequence:
 *   1. PUT /V1/customers/me     — update profile (email / name)
 *   2. PUT /V1/customers/me/password — only if `newPassword` is set
 *
 * Both use the customer token. Magento enforces that changing the email
 * requires a top-level `password` field alongside `customer` in the profile
 * payload, so this route sends `password` only when the email actually changes.
 */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  extractMagentoMessage,
  fetchCustomerMe,
} from "@/lib/checkout";
import type { MagentoCustomerMe } from "@/types/magento";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function PUT(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const firstname = asString(raw.firstname);
  const lastname = asString(raw.lastname);
  const email = asString(raw.email);
  const currentPassword = asString(raw.currentPassword) || undefined;
  const newPassword = asString(raw.newPassword) || undefined;

  if (!firstname || !lastname || !email) {
    return Response.json(
      { error: "firstname, lastname, and email are required" },
      { status: 400 },
    );
  }

  const existing = await fetchCustomerMe(token);
  if (!existing) {
    return Response.json({ error: "Session expired" }, { status: 401 });
  }
  const emailChanged =
    email.toLowerCase() !== (existing.email ?? "").toLowerCase().trim();
  if (emailChanged && !currentPassword) {
    return Response.json(
      { error: "Current password is required when changing email" },
      { status: 400 },
    );
  }

  const next: MagentoCustomerMe = {
    ...existing,
    firstname,
    lastname,
    email,
  };

  const updateRes = await fetch(
    `${MAGENTO}/rest/V1/customers/me`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer: next,
        ...(emailChanged && currentPassword ? { password: currentPassword } : {}),
      }),
      cache: "no-store",
    },
  );
  if (!updateRes.ok) {
    const data = await updateRes.json().catch(() => null);
    return Response.json(
      { error: extractMagentoMessage(data, "Failed to update profile") },
      { status: updateRes.status },
    );
  }

  if (newPassword) {
    if (!currentPassword) {
      return Response.json(
        { error: "Current password is required to change password" },
        { status: 400 },
      );
    }
    const pwRes = await fetch(
      `${MAGENTO}/rest/V1/customers/me/password`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
        cache: "no-store",
      },
    );
    if (!pwRes.ok) {
      const data = await pwRes.json().catch(() => null);
      return Response.json(
        { error: extractMagentoMessage(data, "Failed to change password") },
        { status: pwRes.status },
      );
    }
  }

  return Response.json({ ok: true });
}
