"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  fetchCustomerMe,
  writeCheckoutState,
} from "@/lib/checkout";
import {
  customerAddressToCheckoutAddress,
  inputToCheckoutAddress,
  parseAddressInput,
  toMagentoCustomerAddress,
  type AddressInput,
} from "@/lib/address";
import { updateCustomerMe } from "@/lib/checkout";

export interface SelectAddressArgs {
  locale: string;
  /** "saved" → use existing customer address; "new" → use the form fields. */
  mode: "saved" | "new";
  addressId?: number;
  newAddress?: AddressInput;
  /** When mode === "new", whether to also persist this on the customer record. */
  saveToBook?: boolean;
}

export async function selectAddressAction(
  args: SelectAddressArgs,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cookieStore = await cookies();
  const customerToken = cookieStore.get("swr_customer_token")?.value;
  const cartId = cookieStore.get("swr_cart_id")?.value;

  if (!customerToken) return { ok: false, error: "Not authenticated" };
  if (!cartId) return { ok: false, error: "No active cart" };

  const me = await fetchCustomerMe(customerToken);
  if (!me) return { ok: false, error: "Session expired" };

  if (args.mode === "saved") {
    const saved = (me.addresses ?? []).find((a) => a.id === args.addressId);
    if (!saved) return { ok: false, error: "Address not found" };
    await writeCheckoutState({
      cartId,
      addressId: saved.id,
      address: customerAddressToCheckoutAddress(saved, me.email),
    });
  } else {
    let input: AddressInput;
    try {
      input = parseAddressInput(args.newAddress);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Invalid address",
      };
    }

    let createdAddressId: number | undefined;
    if (args.saveToBook) {
      const newAddr = toMagentoCustomerAddress(input);
      const previousIds = new Set((me.addresses ?? []).map((a) => a.id));
      const result = await updateCustomerMe(customerToken, {
        ...me,
        addresses: [
          ...(me.addresses ?? []).map((a) => ({
            ...a,
            default_billing: newAddr.default_billing
              ? false
              : a.default_billing,
            default_shipping: newAddr.default_shipping
              ? false
              : a.default_shipping,
          })),
          newAddr,
        ],
      });
      if (result.ok && result.data) {
        const created = result.data.addresses?.find(
          (a) => typeof a.id === "number" && !previousIds.has(a.id),
        );
        createdAddressId = created?.id;
      }
    }

    await writeCheckoutState({
      cartId,
      addressId: createdAddressId,
      address: inputToCheckoutAddress(input, me.email),
    });
  }

  redirect(`/${args.locale}/checkout/shipping`);
}
