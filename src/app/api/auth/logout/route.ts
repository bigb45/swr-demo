/**
 * POST /api/auth/logout
 * Clears the customer auth cookie.
 */

import { cookies } from "next/headers";

const COOKIE_NAME = "swr_customer_token";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return Response.json({ ok: true });
}
