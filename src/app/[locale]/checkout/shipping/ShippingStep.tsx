"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/components/CurrencyProvider";
import type { MagentoCheckoutAddress, MagentoShippingMethod } from "@/types/magento";
import { selectShippingAction } from "./actions";

interface ShippingStepProps {
  locale: string;
  address: MagentoCheckoutAddress;
  methods: MagentoShippingMethod[];
}

function methodKey(m: MagentoShippingMethod) {
  return `${m.carrier_code}|${m.method_code}`;
}

export default function ShippingStep({
  locale,
  address,
  methods,
}: ShippingStepProps) {
  const t = useTranslations("checkout");
  const { formatPrice } = useCurrency();
  const intlLocale = useLocale();

  const available = methods.filter((m) => m.available);
  const [selected, setSelected] = useState<string>(
    available.length > 0 ? methodKey(available[0]) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selected) {
      setError(t("noMethodSelected"));
      return;
    }
    const [carrier, method] = selected.split("|");
    startTransition(async () => {
      const result = await selectShippingAction({
        locale,
        shippingCarrierCode: carrier,
        shippingMethodCode: method,
      });
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section
        className="lg:col-span-2 bg-surface-container-lowest rounded-card p-6"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
        <h2 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">
          {t("chooseShippingMethod")}
        </h2>

        {available.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            {t("noShippingMethods")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {available.map((m) => {
              const key = methodKey(m);
              const checked = selected === key;
              return (
                <label
                  key={key}
                  className={`flex items-center justify-between gap-4 p-4 rounded border cursor-pointer transition-colors ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 hover:border-outline-variant"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={key}
                      checked={checked}
                      onChange={() => setSelected(key)}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        {m.carrier_title ?? m.carrier_code}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {m.method_title ?? m.method_code}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-primary">
                    {m.amount > 0
                      ? formatPrice(m.amount, intlLocale)
                      : t("free")}
                  </p>
                </label>
              );
            })}
          </div>
        )}

        {error && (
          <p className="text-xs font-semibold text-red-600 mt-4">{error}</p>
        )}
      </section>

      <aside
        className="bg-surface-container-lowest rounded-card p-6 h-fit"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
        <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-3">
          {t("shippingTo")}
        </h3>
        <div className="text-xs text-on-surface">
          {address.company && (
            <p className="font-bold text-primary mb-1">{address.company}</p>
          )}
          <p className="font-semibold">
            {address.firstname} {address.lastname}
          </p>
          <p className="text-on-surface-variant">{address.street.join(", ")}</p>
          <p className="text-on-surface-variant">
            {address.postcode} {address.city}
          </p>
          <p className="text-on-surface-variant">{address.country_id}</p>
          <p className="text-on-surface-variant mt-1">{address.telephone}</p>
        </div>

        <button
          type="submit"
          disabled={isPending || available.length === 0}
          className="mt-6 w-full px-6 py-3 bg-secondary text-white font-bold text-sm tracking-wide hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-(--radius-btn)"
        >
          {isPending ? t("loading") : t("continueToReview")}
        </button>

        <a
          href={`/${locale}/checkout/address`}
          className="block mt-3 text-center text-xs font-semibold text-on-surface-variant hover:text-on-surface"
        >
          {t("changeAddress")}
        </a>
      </aside>
    </form>
  );
}
