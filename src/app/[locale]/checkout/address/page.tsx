import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchCustomerMe, readCheckoutState } from "@/lib/checkout";
import AddressStep from "./AddressStep";

interface AddressPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AddressPage({ params }: AddressPageProps) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const customerToken = cookieStore.get("swr_customer_token")?.value;
  if (!customerToken) {
    redirect(`/${locale}/account/login?from=/${locale}/checkout/address`);
  }

  const me = await fetchCustomerMe(customerToken);
  const addresses = me?.addresses ?? [];

  // Pre-select the customer's default billing address, or the previous
  // selection if the user navigated back from step 2.
  const previous = await readCheckoutState();
  const defaultId =
    previous?.addressId ??
    addresses.find((a) => a.default_billing)?.id ??
    addresses[0]?.id;

  return (
    <AddressStep
      locale={locale}
      addresses={addresses}
      defaultAddressId={defaultId}
    />
  );
}
