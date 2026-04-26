import { redirect } from "next/navigation";
import {
  estimateShippingMethods,
  getAdminToken,
  readCheckoutState,
} from "@/lib/checkout";
import ShippingStep from "./ShippingStep";

interface ShippingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ShippingPage({ params }: ShippingPageProps) {
  const { locale } = await params;

  const state = await readCheckoutState();
  if (!state) {
    redirect(`/${locale}/checkout/address`);
  }

  let adminToken: string;
  try {
    adminToken = await getAdminToken();
  } catch {
    redirect(`/${locale}/cart`);
  }

  const result = await estimateShippingMethods(
    state.cartId,
    adminToken,
    state.address,
  );

  const methods = result.ok && Array.isArray(result.data) ? result.data : [];
  const loadError = !result.ok;

  return (
    <ShippingStep
      locale={locale}
      address={state.address}
      methods={methods}
      loadError={loadError}
    />
  );
}
