import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { fetchCustomerMe } from "@/lib/checkout";
import { customerAddressToInput } from "@/lib/address";
import { getCountries } from "@/lib/directory";
import { LOCALE_STORE_CODES } from "@/lib/magento-shared";
import AddressForm from "../../AddressForm";

interface EditAddressPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditAddressPage({ params }: EditAddressPageProps) {
  const { locale, id: rawId } = await params;
  const id = Number.parseInt(rawId, 10);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) {
    redirect(
      `/${locale}/account/login?from=/${locale}/account/addresses/${id}/edit`,
    );
  }

  const t = await getTranslations({ locale, namespace: "addresses" });
  const me = await fetchCustomerMe(token);
  const address = (me?.addresses ?? []).find((a) => a.id === id);
  if (!address) notFound();

  const initial = customerAddressToInput(address);
  const countries = await getCountries(LOCALE_STORE_CODES[locale]);

  return (
    <div className="swr-page-shell py-10">
      <div className="mx-auto w-full max-w-[700px]">
      <h1 className="text-2xl font-black text-primary mb-8">{t("editHeading")}</h1>

      <div
        className="bg-surface-container-lowest p-6 sm:p-8 rounded-card"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
        <AddressForm
          addressId={id}
          initial={initial}
          redirectTo={`/${locale}/account/addresses`}
          cancelHref="/account/addresses"
          countries={countries}
        />
      </div>
      </div>
    </div>
  );
}
