import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AddressForm from "../AddressForm";
import { getCountries } from "@/lib/directory";
import { LOCALE_STORE_CODES } from "@/lib/magento-shared";

interface NewAddressPageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewAddressPage({ params }: NewAddressPageProps) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) {
    redirect(`/${locale}/account/login?from=/${locale}/account/addresses/new`);
  }

  const t = await getTranslations({ locale, namespace: "addresses" });
  const countries = await getCountries(LOCALE_STORE_CODES[locale]);

  return (
    <div className="max-w-[700px] mx-auto px-4 sm:px-8 py-10">
      <h1 className="text-2xl font-black text-primary mb-8">{t("addNewHeading")}</h1>

      <div
        className="bg-surface-container-lowest p-6 sm:p-8 rounded-card"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
        <AddressForm
          redirectTo={`/${locale}/account/addresses`}
          cancelHref="/account/addresses"
          countries={countries}
        />
      </div>
    </div>
  );
}
