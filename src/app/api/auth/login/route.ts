/**
 * POST /api/auth/login
 * Body: { email, password }
 * Calls Magento customer token endpoint and sets an httpOnly cookie.
 */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";
const COOKIE_NAME = "swr_customer_token";
const COOKIE_MAX_AGE = 60 * 60; // 1 hour

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return Response.json({ error: "email and password required" }, { status: 400 });
  }

  const res = await fetch(`${MAGENTO}/rest/V1/integration/customer/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password }),
    cache: "no-store",
  });

  if (!res.ok) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token: string = await res.json();

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return Response.json({ ok: true });
}
