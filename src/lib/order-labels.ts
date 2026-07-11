/**
 * Humanize Magento payment method codes and ISO country IDs for order
 * surfaces (detail page, address blocks, PDFs).
 */

export const ORDER_PAYMENT_METHOD_CODES = [
  "checkmo",
  "banktransfer",
  "purchaseorder",
  "cashondelivery",
  "free",
] as const;

export type OrderPaymentMethodCode =
  (typeof ORDER_PAYMENT_METHOD_CODES)[number];

export type PaymentMethodLabels = Partial<
  Record<OrderPaymentMethodCode, string>
>;

export function paymentMethodLabelsFromT(
  t: (key: `paymentMethods.${OrderPaymentMethodCode}`) => string,
): PaymentMethodLabels {
  const labels: PaymentMethodLabels = {};
  for (const code of ORDER_PAYMENT_METHOD_CODES) {
    labels[code] = t(`paymentMethods.${code}`);
  }
  return labels;
}

/** Localized label for a Magento payment method code; falls back to the raw code. */
export function formatPaymentMethod(
  code: string | null | undefined,
  labels: PaymentMethodLabels,
): string {
  if (!code) return "";
  const known = labels[code as OrderPaymentMethodCode];
  return known ?? code;
}

/** Localized country name from an ISO 3166-1 alpha-2 code via Intl.DisplayNames. */
export function formatCountryId(
  locale: string,
  countryId: string | null | undefined,
): string {
  if (!countryId) return "";
  try {
    const name = new Intl.DisplayNames([locale], { type: "region" }).of(
      countryId.toUpperCase(),
    );
    return name ?? countryId;
  } catch {
    return countryId;
  }
}
