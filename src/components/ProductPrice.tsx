"use client";

import { useLocale } from "next-intl";
import { useCurrency } from "./CurrencyProvider";

interface ProductPriceProps {
  eurPrice: number;
  exclVatLabel: string;
  priceOnRequestLabel: string;
  className?: string;
}

export default function ProductPrice({
  eurPrice,
  exclVatLabel,
  priceOnRequestLabel,
  className = "",
}: ProductPriceProps) {
  const { formatPrice } = useCurrency();
  const locale = useLocale();

  if (eurPrice <= 0) {
    return (
      <span className={`text-gray-500 ${className}`}>{priceOnRequestLabel}</span>
    );
  }

  return (
    <span className={className}>
      {formatPrice(eurPrice, locale)}
      <span className="text-sm font-normal text-gray-500 ml-2">
        {exclVatLabel}
      </span>
    </span>
  );
}
