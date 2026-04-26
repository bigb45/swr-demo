"use client";

import { useTranslations } from "next-intl";
import { useCurrency } from "./CurrencyProvider";
import type { SupportedCurrency } from "@/lib/currency";

interface CurrencySwitcherProps {
  /**
   * "dark" (default) — white text/arrow for use on the navy utility bar.
   * "light" — on-surface text/arrow for use on white backgrounds like the mobile drawer.
   */
  tone?: "dark" | "light";
  className?: string;
}

export default function CurrencySwitcher({
  tone = "dark",
  className = "",
}: CurrencySwitcherProps) {
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const t = useTranslations("nav");

  if (availableCurrencies.length <= 1) return null;

  const textClass =
    tone === "light" ? "text-on-surface" : "text-white";
  const arrowClass =
    tone === "light" ? "text-on-surface-variant" : "text-white/50";
  const selectSizeClass =
    tone === "light" ? "min-h-9 px-2.5 rounded-(--radius-btn)" : "";

  return (
    <div
      className={`relative inline-flex items-center text-xs ${className}`}
    >
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
        className={`appearance-none text-xs font-medium ${textClass} bg-transparent border-none focus:outline-none cursor-pointer pr-5 ${selectSizeClass}`}
        aria-label={t("selectCurrency")}
      >
        {availableCurrencies.map((c) => (
          <option key={c} value={c} className="text-black bg-white">
            {c}
          </option>
        ))}
      </select>
      <span
        className={`pointer-events-none absolute right-0 ${arrowClass} text-[10px] leading-none`}
      >
        ▾
      </span>
    </div>
  );
}
