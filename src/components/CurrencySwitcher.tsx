"use client";

import { useCurrency } from "./CurrencyProvider";
import type { SupportedCurrency } from "@/lib/currency";

export default function CurrencySwitcher() {
  const { currency, setCurrency, availableCurrencies } = useCurrency();

  if (availableCurrencies.length <= 1) return null;

  return (
    <div className="relative inline-flex items-center text-xs">
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
        className="appearance-none text-xs font-medium text-white bg-transparent border-none focus:outline-none cursor-pointer pr-4"
        aria-label="Select currency"
      >
        {availableCurrencies.map((c) => (
          <option key={c} value={c} className="text-black bg-white">
            {c}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow, absolutely positioned over the select's right padding */}
      <span className="pointer-events-none absolute right-0 text-white/50 text-[10px] leading-none">
        ▾
      </span>
    </div>
  );
}
