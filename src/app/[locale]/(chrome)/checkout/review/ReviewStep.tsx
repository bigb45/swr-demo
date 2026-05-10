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

  const [paymentMethod, setPaymentMethod] = useState<string>(
    paymentMethods[0]?.code ?? "checkmo",
  );
  const [poNumber, setPoNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const lineItemsId = "review-line-items-heading";
  const shipmentId = "review-shipment-heading";
  const paymentId = "review-payment-heading";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const trimmedPo = poNumber.trim();
      const result = await placeOrderAction({
        locale,
        paymentMethod,
        ...(trimmedPo ? { poNumber: trimmedPo } : {}),
      });
      if (result && !result.ok) {
        setError(result.error);
        return;
      }
      cart.resetCartId();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <div className="lg:col-span-2">
        <div
          className="rounded-card overflow-hidden bg-surface-container-lowest"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          {/* Line items */}
          <section
            className="p-5 sm:p-6"
            aria-labelledby={lineItemsId}
          >
            <h2
              id={lineItemsId}
              className="text-sm font-bold text-primary uppercase tracking-wide mb-4"
            >
              {t("orderItems")}
            </h2>
            <div className="-mx-5 sm:-mx-6 overflow-x-auto">
              <table className="w-full min-w-[320px] text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th
                      id={lineItemsId + "-col-product"}
                      scope="col"
                      className="px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant"
                    >
                      {t("colProduct")}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant text-right whitespace-nowrap w-16"
                    >
                      {t("qty")}
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant text-right whitespace-nowrap"
                    >
                      {t("colLineTotal")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(totals.items ?? []).map((it, rowIdx) => (
                    <tr
                      key={it.item_id}
                      className={
                        rowIdx % 2 === 1
                          ? "bg-surface-container-low/60 hover:bg-primary-fixed transition-colors"
                          : "bg-surface-container-lowest hover:bg-primary-fixed transition-colors"
                      }
                    >
                      <td
                        headers={lineItemsId + "-col-product"}
                        className="px-4 sm:px-6 py-3 align-top"
                      >
                        <span className="font-semibold text-on-surface wrap-break-word block">
                          {it.name}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top text-right tabular-nums text-on-surface">
                        {it.qty}
                      </td>
                      <td className="px-4 sm:px-6 py-3 align-top text-right font-bold text-primary tabular-nums whitespace-nowrap">
                        {formatPrice(it.row_total ?? 0, intlLocale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Shipment */}
          <section
            className="bg-surface-container-low px-5 py-5 sm:px-6"
            aria-labelledby={shipmentId}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <h2
                id={shipmentId}
                className="text-sm font-bold text-primary uppercase tracking-wide"
              >
                {t("deliveryDetails")}
              </h2>
              <Link
                href="/checkout/address"
                className="text-xs font-semibold text-secondary hover:underline shrink-0"
              >
                {t("change")}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-on-surface">
              <div>
                <p className="text-on-surface-variant uppercase tracking-wide mb-1 text-[10px] font-bold">
                  {t("shipTo")}
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
                <p className="text-on-surface-variant mt-1">{address.telephone}</p>
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <p className="text-on-surface-variant uppercase tracking-wide text-[10px] font-bold">
                    {t("shippingMethod")}
                  </p>
                  <Link
                    href="/checkout/shipping"
                    className="text-xs font-semibold text-secondary hover:underline sm:hidden"
                  >
                    {t("change")}
                  </Link>
                </div>
                <p className="font-semibold">
                  {shippingTitle ?? t("methodNotSet")}
                </p>
                <Link
                  href="/checkout/shipping"
                  className="text-xs font-semibold text-secondary hover:underline mt-2 hidden sm:inline-block"
                >
                  {t("change")}
                </Link>
              </div>
            </div>
          </section>

          {/* Payment + PO */}
          <section
            className="p-5 sm:p-6"
            aria-labelledby={paymentId}
          >
            <h2
              id={paymentId}
              className="text-sm font-bold text-primary uppercase tracking-wide mb-4"
            >
              {t("paymentAndReference")}
            </h2>
            {paymentMethods.length === 0 ? (
              <p className="text-xs text-on-surface-variant">
                {t("paymentMethodFallback")}
              </p>
            ) : (
              <div className="flex flex-col gap-2 mb-5">
                {paymentMethods.map((m) => {
                  const checked = paymentMethod === m.code;
                  return (
                    <label
                      key={m.code}
                      className={`flex items-center gap-3 p-3 rounded-(--radius-input) cursor-pointer transition-colors text-sm ${
                        checked
                          ? "bg-primary/8 border border-primary/30"
                          : "bg-surface-container-low/80 border border-transparent hover:border-outline-variant/30"
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
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                {t("poReferenceLabel")}
              </span>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder={t("poNumberPlaceholder")}
                className="w-full px-3 py-2.5 text-sm border border-outline-variant/60 rounded-(--radius-input) bg-surface focus:outline-none focus:border-primary text-on-surface"
              />
            </label>
          </section>
        </div>
      </div>

      <aside
        className="bg-surface-container-lowest rounded-card p-6 h-fit lg:sticky lg:top-6"
        style={{ boxShadow: "var(--shadow-ambient)" }}
        aria-label={t("orderSummary")}
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
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-outline-variant/15">
            <span className="font-bold text-primary uppercase tracking-wide text-xs">
              {t("grandTotal")}
            </span>
            <span className="text-lg font-black text-primary tabular-nums">
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

        <p className="text-xs text-on-surface mt-3 text-center font-medium">
          {t("authorizationNoteShort")}
        </p>
        <p className="text-[11px] text-on-surface-variant/80 mt-1.5 text-center leading-snug">
          {t("authorizationNoteLegal")}
        </p>
      </aside>
    </form>
  );
}
