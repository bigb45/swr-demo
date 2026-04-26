"use server";

import { cookies } from "next/headers";
import { acceptQuotation, type AcceptQuotationResult } from "@/lib/quotations";

const CUSTOMER_TOKEN_COOKIE = "swr_customer_token";

export async function acceptQuotationAction(
  id: string,
): Promise<AcceptQuotationResult> {
  const store = await cookies();
  const token = store.get(CUSTOMER_TOKEN_COOKIE)?.value;
  if (!token) {
    return { success: false, code: "not_found", message: "Not signed in" };
  }
  return acceptQuotation(id, token);
}
