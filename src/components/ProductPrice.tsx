"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatErpPrice } from "@/lib/erp-shared";

interface ProductPriceProps {
  eurPrice: number;
  exclVatLabel: string;
  priceOnRequestLabel: string;
  className?: string;
  /**
   * When set, formats `eurPrice` in this ISO currency via Intl (ERP contract
   * amounts). Magento catalog prices are never displayed.
   */
  currency?: string | null;
}

export default function ProductPrice({
  eurPrice,
  exclVatLabel,
  priceOnRequestLabel,
  className = "",
  currency = null,
}: ProductPriceProps) {
  const locale = useLocale();
  const t = useTranslations("products");

  if (!currency) {
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

  if (eurPrice <= 0 || !Number.isFinite(eurPrice)) {
    return (
      <span className={`text-on-surface-variant ${className}`}>
        {priceOnRequestLabel}
      </span>
    );
  }

  const formatted = formatErpPrice(eurPrice, currency, locale);

  return (
    <span className={className}>
      {formatted}
      {exclVatLabel ? (
        <span className="text-sm font-normal text-on-surface-variant ml-2">
          {exclVatLabel}
        </span>
      ) : null}
    </span>
  );
}
