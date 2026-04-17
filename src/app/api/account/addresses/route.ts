/**
 * GET  /api/account/addresses
 * POST /api/account/addresses
 *
 * Both routes proxy to Magento's `/V1/customers/me` because Magento doesn't
 * expose a per-address create endpoint for customers — addresses are managed
 * as part of the full customer record.
 *
 * Auth: requires the `swr_customer_token` cookie. 401 otherwise.
 */

import { NextRequest } from "next/server";
import {
  extractMagentoMessage,
  fetchCustomerMe,
  getCustomerToken,
  updateCustomerMe,
} from "@/lib/checkout";
import {
  parseAddressInput,
  toMagentoCustomerAddress,
  type AddressInput,
} from "@/lib/address";

export async function GET() {
  const token = await getCustomerToken();
  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const me = await fetchCustomerMe(token);
  if (!me) {
    return Response.json({ error: "Session expired" }, { status: 401 });
  }

  return Response.json({ addresses: me.addresses ?? [] });
}

export async function POST(req: NextRequest) {
  const token = await getCustomerToken();
  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let input: AddressInput;
  try {
    input = parseAddressInput(await req.json());
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Invalid address" },
      { status: 400 },
    );
  }

  const me = await fetchCustomerMe(token);
  if (!me) {
    return Response.json({ error: "Session expired" }, { status: 401 });
  }

  const newAddress = toMagentoCustomerAddress(input);
  // If the new address is marked default, clear that flag on the others
  // (Magento allows only one default of each type).
  const existing = (me.addresses ?? []).map((a) => ({
    ...a,
    default_billing: newAddress.default_billing ? false : a.default_billing,
    default_shipping: newAddress.default_shipping ? false : a.default_shipping,
  }));

  const updated = await updateCustomerMe(token, {
    ...me,
    addresses: [...existing, newAddress],
  });

  if (!updated.ok || !updated.data) {
    return Response.json(
      { error: extractMagentoMessage(updated.data, "Failed to save address") },
      { status: updated.status || 502 },
    );
  }

  // Magento returns the updated customer; the new address is the last one
  // with no matching id in the previous list.
  const previousIds = new Set((me.addresses ?? []).map((a) => a.id));
  const created =
    updated.data.addresses?.find(
      (a) => typeof a.id === "number" && !previousIds.has(a.id),
    ) ?? null;

  return Response.json({ address: created, addresses: updated.data.addresses ?? [] });
}
