/**
 * PUT    /api/account/addresses/:id  - update one address
 * DELETE /api/account/addresses/:id  - delete one address
 *
 * Update is implemented by re-uploading the entire customer record with the
 * target address replaced. Delete uses Magento's per-address admin endpoint
 * `DELETE /V1/addresses/:id` (no customer-token equivalent exists).
 */

import { NextRequest } from "next/server";
import {
  deleteCustomerAddress,
  extractMagentoMessage,
  fetchCustomerMe,
  getAdminToken,
  getCustomerToken,
  updateCustomerMe,
} from "@/lib/checkout";
import {
  parseAddressInput,
  toMagentoCustomerAddress,
  type AddressInput,
} from "@/lib/address";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (!id) {
    return Response.json({ error: "Invalid address id" }, { status: 400 });
  }

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

  const target = (me.addresses ?? []).find((a) => a.id === id);
  if (!target) {
    return Response.json({ error: "Address not found" }, { status: 404 });
  }

  const updatedAddress = toMagentoCustomerAddress(input, id);
  const others = (me.addresses ?? [])
    .filter((a) => a.id !== id)
    .map((a) => ({
      ...a,
      default_billing: updatedAddress.default_billing
        ? false
        : a.default_billing,
      default_shipping: updatedAddress.default_shipping
        ? false
        : a.default_shipping,
    }));

  const result = await updateCustomerMe(token, {
    ...me,
    addresses: [...others, updatedAddress],
  });

  if (!result.ok || !result.data) {
    return Response.json(
      { error: extractMagentoMessage(result.data, "Failed to update address") },
      { status: result.status || 502 },
    );
  }

  return Response.json({ addresses: result.data.addresses ?? [] });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (!id) {
    return Response.json({ error: "Invalid address id" }, { status: 400 });
  }

  const token = await getCustomerToken();
  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify the address belongs to the signed-in customer before letting the
  // admin token delete it.
  const me = await fetchCustomerMe(token);
  if (!me) {
    return Response.json({ error: "Session expired" }, { status: 401 });
  }
  const owns = (me.addresses ?? []).some((a) => a.id === id);
  if (!owns) {
    return Response.json({ error: "Address not found" }, { status: 404 });
  }

  let adminToken: string;
  try {
    adminToken = await getAdminToken();
  } catch {
    return Response.json({ error: "Backend unavailable" }, { status: 502 });
  }

  const result = await deleteCustomerAddress(adminToken, id);
  if (!result.ok) {
    return Response.json(
      { error: extractMagentoMessage(result.data, "Failed to delete address") },
      { status: result.status || 502 },
    );
  }

  return Response.json({ ok: true });
}
