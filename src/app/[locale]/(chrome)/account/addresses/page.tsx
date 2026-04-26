import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { fetchCustomerMe } from "@/lib/checkout";
import DeleteAddressButton from "./DeleteAddressButton";

interface AddressesPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AddressesPage({ params }: AddressesPageProps) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) {
    redirect(`/${locale}/account/login?from=/${locale}/account/addresses`);
  }

  const t = await getTranslations({ locale, namespace: "addresses" });

  const me = await fetchCustomerMe(token);
  const addresses = me?.addresses ?? [];

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary">{t("heading")}</h1>
          <p className="text-sm text-on-surface-variant mt-1">{t("subheading")}</p>
        </div>
        <Link
          href="/account/addresses/new"
          className="px-5 py-2.5 bg-secondary text-white font-bold text-sm tracking-wide hover:brightness-110 transition-all rounded-(--radius-btn)"
        >
          {t("addNew")}
        </Link>
      </div>

      {addresses.length === 0 ? (
        <div
          className="bg-surface-container-lowest rounded-card px-8 py-12 text-center"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <p className="text-sm text-on-surface-variant">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div
              key={a.id}
              className="bg-surface-container-lowest p-6 rounded-card flex flex-col gap-3"
              style={{ boxShadow: "var(--shadow-ambient)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm">
                  {a.company && (
                    <p className="font-bold text-primary">{a.company}</p>
                  )}
                  <p className="font-semibold text-on-surface">
                    {a.firstname} {a.lastname}
                  </p>
                  <p className="text-on-surface-variant">{a.street.join(", ")}</p>
                  <p className="text-on-surface-variant">
                    {a.postcode} {a.city}
                  </p>
                  <p className="text-on-surface-variant">
                    {a.region?.region ? `${a.region.region}, ` : ""}
                    {a.country_id}
                  </p>
                  <p className="text-on-surface-variant mt-1">{a.telephone}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {a.default_billing && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {t("defaultBillingBadge")}
                    </span>
                  )}
                  {a.default_shipping && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-secondary/10 text-secondary px-2 py-0.5 rounded">
                      {t("defaultShippingBadge")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-3 border-t border-outline-variant/30">
                <Link
                  href={`/account/addresses/${a.id}/edit`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {t("edit")}
                </Link>
                {typeof a.id === "number" && (
                  <DeleteAddressButton addressId={a.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/account"
          className="text-xs font-semibold text-on-surface-variant hover:text-on-surface"
        >
          &larr; {t("backToAccount")}
        </Link>
      </div>
    </div>
  );
}
