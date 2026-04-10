import { magentoGet } from "./magento";

export interface ExchangeRate {
  currency_to: string;
  rate: number;
}

export interface CurrencyRates {
  base_currency_code: string;
  base_currency_symbol: string;
  default_display_currency_code: string;
  default_display_currency_symbol: string;
  available_currency_codes: string[];
  exchange_rates: ExchangeRate[];
}

export type SupportedCurrency = "EUR" | "CHF";

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ["EUR", "CHF"];

export const DEFAULT_CURRENCY_BY_LOCALE: Record<string, SupportedCurrency> = {
  de: "EUR",
  fr: "EUR",
  en: "CHF",
};

// Fallback rates used when Magento has no rates configured yet
const FALLBACK_RATES: Record<string, number> = {
  EUR: 1,
  CHF: 0.96,
};

export async function getCurrencyRates(): Promise<CurrencyRates> {
  try {
    return await magentoGet<CurrencyRates>("/directory/currency", 3600);
  } catch {
    return {
      base_currency_code: "EUR",
      base_currency_symbol: "€",
      default_display_currency_code: "EUR",
      default_display_currency_symbol: "€",
      available_currency_codes: ["EUR", "CHF"],
      exchange_rates: [{ currency_to: "CHF", rate: FALLBACK_RATES.CHF }],
    };
  }
}

export function convertPrice(
  eurPrice: number,
  currency: string,
  rates: CurrencyRates
): number {
  if (currency === rates.base_currency_code) return eurPrice;
  const rate =
    rates.exchange_rates.find((r) => r.currency_to === currency)?.rate ??
    FALLBACK_RATES[currency] ??
    1;
  return eurPrice * rate;
}

export function formatPrice(
  eurPrice: number,
  currency: string,
  locale: string,
  rates: CurrencyRates
): string {
  if (eurPrice <= 0) return "";
  const converted = convertPrice(eurPrice, currency, rates);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
}
