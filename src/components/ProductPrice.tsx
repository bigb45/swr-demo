"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrency } from "./CurrencyProvider";
import { useCustomerSession } from "./CustomerSessionProvider";

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
  const { isAuthenticated } = useCustomerSession();
  const { formatPrice } = useCurrency();
  const locale = useLocale();
  const t = useTranslations("products");

  if (!isAuthenticated && eurPrice > 0) {
    return (
      <span className={`inline-flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2 ${className}`}>
        <span className="text-sm font-normal text-on-surface-variant">
          {t("pricesLoginRequired")}
        </span>
        <Link
          href="/account/login"
          className="text-sm font-bold text-secondary underline"
        >
          {t("signInForPrices")}
        </Link>
      </span>
    );
  }

  if (eurPrice <= 0) {
    return (
      <span className={`text-gray-500 ${className}`}>{priceOnRequestLabel}</span>
    );
  }

  return (
    <span className={className}>
      {formatPrice(eurPrice, locale)}
      {exclVatLabel ? (
        <span className="text-sm font-normal text-gray-500 ml-2">
          {exclVatLabel}
        </span>
      ) : null}
    </span>
  );
}
