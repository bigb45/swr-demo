"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { CurrencyRates, SupportedCurrency } from "@/lib/currency";
import { formatPrice as _formatPrice } from "@/lib/currency";

const COOKIE_NAME = "preferred_currency";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

interface CurrencyContextValue {
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  formatPrice: (eurPrice: number, locale: string) => string;
  /** Formats a EUR price using the active currency and a sensible locale. */
  formatAmount: (eurPrice: number) => string;
  rates: CurrencyRates;
  availableCurrencies: SupportedCurrency[];
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readCurrencyCookie(): SupportedCurrency | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`)
  );
  return match ? (decodeURIComponent(match[1]) as SupportedCurrency) : null;
}

function writeCurrencyCookie(currency: SupportedCurrency) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(currency)}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

interface CurrencyProviderProps {
  children: React.ReactNode;
  rates: CurrencyRates;
  defaultCurrency: SupportedCurrency;
}

export function CurrencyProvider({
  children,
  rates,
  defaultCurrency,
}: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    // On server, use the locale-based default
    return defaultCurrency;
  });

  // On mount, check cookie and override if present
  useEffect(() => {
    const saved = readCurrencyCookie();
    if (saved && (saved === "EUR" || saved === "CHF")) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = useCallback((c: SupportedCurrency) => {
    setCurrencyState(c);
    writeCurrencyCookie(c);
  }, []);

  const formatPrice = useCallback(
    (eurPrice: number, locale: string) =>
      _formatPrice(eurPrice, currency, locale, rates),
    [currency, rates]
  );

  const formatAmount = useCallback(
    (eurPrice: number) =>
      _formatPrice(eurPrice, currency, currency === "CHF" ? "de-CH" : "de-DE", rates),
    [currency, rates]
  );

  // Build available currencies from Magento rates + base
  const availableCurrencies: SupportedCurrency[] = [
    rates.base_currency_code as SupportedCurrency,
    ...rates.exchange_rates
      .map((r) => r.currency_to as SupportedCurrency)
      .filter((c) => c === "EUR" || c === "CHF"),
  ].filter((c, i, arr) => arr.indexOf(c) === i);

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, formatPrice, formatAmount, rates, availableCurrencies }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
