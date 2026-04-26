"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/CartProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import type {
  MagentoCheckoutAddress,
  MagentoPaymentMethod,
} from "@/types/magento";
import type { GuestCartTotalsResponse } from "@/lib/checkout";
import { placeOrderAction } from "./actions";

interface ReviewStepProps {
  locale: string;
  address: MagentoCheckoutAddress;
  totals: GuestCartTotalsResponse;
  shippingTitle: string | null;
  paymentMethods: MagentoPaymentMethod[];
}

export default function ReviewStep({
  locale,
  address,
  totals,
  shippingTitle,
  paymentMethods,
}: ReviewStepProps) {
  const t = useTranslations("checkout");
  const { formatPrice } = useCurrency();
  const intlLocale = useLocale();
  const cart = useCart();

  // Default to the first payment method Magento returned. If the list is
  // empty (misconfigured store), fall back to `checkmo` — the only method
  // reliably available in a vanilla Magento install.
  const [paymentMethod, setPaymentMethod] = useState<string>(
    paymentMethods[0]?.code ?? "checkmo",
  );
  const [poNumber, setPoNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await placeOrderAction({
        locale,
        paymentMethod,
        poNumber: poNumber.trim() || undefined,
      });
      if (result && !result.ok) {
        setError(result.error);
        return;
      }
      // Server action already redirected on success — drop the local cart
      // mirror so the badge updates immediately on the destination page.
      cart.resetCartId();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <section className="lg:col-span-2 flex flex-col gap-6">
        <div
          className="bg-surface-container-lowest rounded-card p-6"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <h2 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">
            {t("orderItems")}
          </h2>
          <div className="divide-y divide-outline-variant/30">
            {(totals.items ?? []).map((it) => (
              <div
                key={it.item_id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-on-surface wrap-break-word">
                    {it.name}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {t("qty")}: {it.qty}
                  </p>
                </div>
                <p className="font-bold text-primary shrink-0 whitespace-nowrap">
                  {formatPrice(it.row_total ?? 0, intlLocale)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="bg-surface-container-lowest rounded-card p-6"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wide">
              {t("deliveryDetails")}
            </h2>
            <Link
              href="/checkout/address"
              className="text-xs font-semibold text-secondary hover:underline"
            >
              {t("change")}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-on-surface">
            <div>
              <p className="text-on-surface-variant uppercase tracking-wide mb-1 text-[10px] font-bold">
                {t("shippingAddress")}
              </p>
              {address.company && (
                <p className="font-bold text-primary">{address.company}</p>
              )}
              <p className="font-semibold">
                {address.firstname} {address.lastname}
              </p>
              <p className="text-on-surface-variant">
                {address.street.join(", ")}
              </p>
              <p className="text-on-surface-variant">
                {address.postcode} {address.city}
              </p>
              <p className="text-on-surface-variant">{address.country_id}</p>
              <p className="text-on-surface-variant mt-1">
                {address.telephone}
              </p>
            </div>
            <div>
              <p className="text-on-surface-variant uppercase tracking-wide mb-1 text-[10px] font-bold">
                {t("shippingMethod")}
              </p>
              <p className="font-semibold">
                {shippingTitle ?? t("methodNotSet")}
              </p>
              <Link
                href="/checkout/shipping"
                className="text-xs font-semibold text-secondary hover:underline mt-2 inline-block"
              >
                {t("change")}
              </Link>
            </div>
          </div>
        </div>

        <div
          className="bg-surface-container-lowest rounded-card p-6"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <h2 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">
            {t("paymentMethod")}
          </h2>
          {paymentMethods.length === 0 ? (
            <p className="text-xs text-on-surface-variant">
              {t("paymentMethodFallback")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {paymentMethods.map((m) => {
                const checked = paymentMethod === m.code;
                return (
                  <label
                    key={m.code}
                    className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors text-sm ${
                      checked
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant/40 hover:border-outline-variant"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.code}
                      checked={checked}
                      onChange={() => setPaymentMethod(m.code)}
                      className="accent-primary"
                    />
                    <span className="font-semibold text-on-surface">
                      {m.title ?? m.code}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div
          className="bg-surface-container-lowest rounded-card p-6"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {t("poNumber")} <span className="lowercase">({t("optional")})</span>
            </span>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder={t("poNumberPlaceholder")}
              className="w-full px-3 py-2.5 text-sm border border-outline-variant/60 rounded-(--radius-input) bg-surface focus:outline-none focus:border-primary text-on-surface"
            />
          </label>
        </div>
      </section>

      <aside
        className="bg-surface-container-lowest rounded-card p-6 h-fit"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
        <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">
          {t("orderSummary")}
        </h3>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">{t("subtotal")}</span>
            <span className="font-semibold text-on-surface">
              {formatPrice(totals.subtotal ?? 0, intlLocale)}
            </span>
          </div>
          {(totals.shipping_amount ?? 0) > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">{t("shipping")}</span>
              <span className="font-semibold text-on-surface">
                {formatPrice(totals.shipping_amount ?? 0, intlLocale)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">{t("tax")}</span>
            <span className="font-semibold text-on-surface">
              {formatPrice(totals.tax_amount ?? 0, intlLocale)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-outline-variant/30">
            <span className="font-bold text-primary uppercase tracking-wide text-xs">
              {t("grandTotal")}
            </span>
            <span className="text-lg font-black text-primary">
              {formatPrice(totals.grand_total ?? 0, intlLocale)}
            </span>
          </div>
        </div>

        {error && (
          <p className="text-xs font-semibold text-red-600 mt-4">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-6 w-full px-6 py-3 bg-secondary text-white font-bold text-sm tracking-wide hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-(--radius-btn)"
        >
          {isPending ? t("placingOrder") : t("placeOrder")}
        </button>

        <p className="text-[11px] text-on-surface-variant/70 mt-3 text-center">
          {t("authorizationNote")}
        </p>
      </aside>
    </form>
  );
}
