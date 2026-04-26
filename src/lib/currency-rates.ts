import type { CurrencyRates } from "./currency";
import { magentoGet } from "./magento";

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
      exchange_rates: [{ currency_to: "CHF", rate: 0.96 }],
    };
  }
}
