"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  extractMagentoMessage,
  getAdminToken,
  readCheckoutState,
  setShippingInformation,
  writeCheckoutState,
} from "@/lib/checkout";

export interface SelectShippingArgs {
  locale: string;
  shippingCarrierCode: string;
  shippingMethodCode: string;
}

export async function selectShippingAction(
  args: SelectShippingArgs,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cookieStore = await cookies();
  const customerToken = cookieStore.get("swr_customer_token")?.value;
  if (!customerToken) return { ok: false, error: "Not authenticated" };

  const state = await readCheckoutState();
  if (!state) {
    return { ok: false, error: "Address not selected" };
  }

  let adminToken: string;
  try {
    adminToken = await getAdminToken();
  } catch {
    return { ok: false, error: "Backend unavailable" };
  }

  const result = await setShippingInformation(state.cartId, adminToken, {
    address: state.address,
    shippingCarrierCode: args.shippingCarrierCode,
    shippingMethodCode: args.shippingMethodCode,
  });

  if (!result.ok || !result.data) {
    return {
      ok: false,
      error: extractMagentoMessage(
        result.data,
        "Failed to save shipping selection",
      ),
    };
  }

  // Persist the chosen method on the cookie so step 3 can re-display it
  // (Magento also stores it on the cart, but reading the cookie is cheaper
  // and survives soft refreshes).
  await writeCheckoutState({
    ...state,
    address: {
      ...state.address,
    },
  });

  redirect(`/${args.locale}/checkout/review`);
}
