"use client";

/**
 * Simple (non-configurable) PDP purchase panel.
 * Fetches live ERP price immediately on mount; shows Add to Cart once priced.
 */

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/CartProvider";
import { useCustomerSession } from "@/components/CustomerSessionProvider";
import ProductPrice from "@/components/ProductPrice";
import WatchlistButton from "@/components/WatchlistButton";
import ProductCustomOptions from "@/components/ui/ProductCustomOptions";
import StockBadge from "@/components/ui/StockBadge";
import { useErpPrice } from "@/components/product/useErpPrice";
import {
  buildCustomOptionsPayload,
  getMissingRequiredOptions,
  getSupportedOptions,
  isSelectOption,
  type CustomOptionSelectionState,
} from "@/lib/custom-options";
import {
  formatErpPrice,
  mergeErpStock,
  resolvePriceDisplay,
  type ErpSkuData,
} from "@/lib/erp-shared";
import { getProductImageUrl } from "@/lib/magento-shared";
import { getStockStatus, type StockLevel } from "@/lib/stock";
import { notify } from "@/lib/toast";
import type { MagentoProduct } from "@/types/magento";

type Status = "idle" | "loading" | "success" | "error";

interface SimpleProductPurchaseProps {
  product: MagentoProduct;
  /** Optional SSR ERP seed (stock + price); live `/api/erp-price` wins for amount. */
  initialErp?: ErpSkuData | null;
  stockLabel: string;
}

export default function SimpleProductPurchase({
  product,
  initialErp = null,
  stockLabel,
}: SimpleProductPurchaseProps) {
  const { addItem } = useCart();
  const { isAuthenticated } = useCustomerSession();
  const locale = useLocale();
  const t = useTranslations("products");
  const [qty, setQty] = useState(1);
  const [inputVal, setInputVal] = useState("1");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [optionSelection, setOptionSelection] =
    useState<CustomOptionSelectionState>({});
  const [missingOptionIds, setMissingOptionIds] = useState<Set<string>>(
    new Set(),
  );

  const erpPrice = useErpPrice(product.sku, qty);

  const liveErp: ErpSkuData | null =
    erpPrice.state === "priced" && erpPrice.netAmount != null
      ? {
          netAmount: erpPrice.netAmount,
          grossAmount: erpPrice.grossAmount,
          currency: erpPrice.currency,
          quantityUnit: initialErp?.quantityUnit ?? null,
          erpStockAvailable: initialErp?.erpStockAvailable ?? null,
          erpStockQty: initialErp?.erpStockQty ?? null,
        }
      : initialErp;

  const hasSeedAmount =
    liveErp?.netAmount != null && Number.isFinite(liveErp.netAmount);

  const priceLoading =
    isAuthenticated &&
    !hasSeedAmount &&
    (erpPrice.state === "idle" || erpPrice.state === "loading");

  const priceDisplay = resolvePriceDisplay(liveErp, {
    isAuthenticated,
    hasEnventaCustomer: erpPrice.state !== "no_customer",
    loading: priceLoading,
  });

  const supportedOptions = getSupportedOptions(product.options);
  const stock = mergeErpStock(getStockStatus(product), liveErp);

  const hasErpPrice = priceDisplay.kind === "amount";
  const basePrice = hasErpPrice ? priceDisplay.net : 0;
  const erpCurrency = hasErpPrice ? priceDisplay.currency : "EUR";

  const optionsSurcharge = supportedOptions.reduce((sum, opt) => {
    if (!isSelectOption(opt.type)) return sum;
    const raw = optionSelection[String(opt.option_id)];
    const ids = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const id of ids) {
      const value = opt.values?.find(
        (v) => String(v.option_type_id) === id,
      );
      if (!value?.price) continue;
      sum +=
        value.price_type === "percent"
          ? (basePrice * value.price) / 100
          : value.price;
    }
    return sum;
  }, 0);

  const hideCatalogPrices = !isAuthenticated && !hasErpPrice;
  const canAddToCart = hasErpPrice && stock.level !== "out";
  const watchlistImageUrl = getProductImageUrl(product);
  const currentUnitPrice = basePrice + optionsSurcharge;

  function formatMoney(amount: number): string {
    if (amount <= 0 || !hasErpPrice) return t("priceOnRequest");
    return formatErpPrice(amount, erpCurrency, locale);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputVal(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed) && parsed >= 1) setQty(parsed);
  }

  function handleBlur() {
    const clamped = Math.max(1, parseInt(inputVal, 10) || 1);
    setQty(clamped);
    setInputVal(String(clamped));
  }

  function stepQty(delta: number) {
    const next = Math.max(1, qty + delta);
    setQty(next);
    setInputVal(String(next));
  }

  function handleOptionChange(optionId: string, next: string | string[]) {
    setOptionSelection((prev) => ({ ...prev, [optionId]: next }));
    if (missingOptionIds.has(optionId)) {
      setMissingOptionIds((prev) => {
        const updated = new Set(prev);
        updated.delete(optionId);
        return updated;
      });
    }
  }

  async function handleAddToCart() {
    if (!canAddToCart) return;

    const missing = getMissingRequiredOptions(product.options, optionSelection);
    if (missing.length > 0) {
      setMissingOptionIds(new Set(missing.map((o) => String(o.option_id))));
      setStatus("error");
      setErrorMsg(t("options.requiredError"));
      notify.error(t("options.requiredError"));
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    const customOptions = buildCustomOptionsPayload(
      product.options,
      optionSelection,
    );

    setStatus("loading");
    setErrorMsg("");
    try {
      await addItem(
        product,
        qty,
        customOptions.length > 0 ? { customOptions } : undefined,
      );
      setStatus("success");
      notify.success(t("added"));
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : t("addToCartError");
      setErrorMsg(message);
      setStatus("error");
      notify.error(message);
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <div
      className="bg-surface-container-lowest shadow-ambient p-6 flex flex-col gap-6"
      style={{ borderRadius: "var(--radius-card)" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant mb-1">
            {t("standardPrice")}
          </p>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {priceDisplay.kind === "amount" ? (
              <ProductPrice
                eurPrice={priceDisplay.net}
                currency={priceDisplay.currency}
                exclVatLabel={t("exclVat")}
                priceOnRequestLabel={t("priceOnRequest")}
                className="text-3xl sm:text-4xl font-black text-on-surface leading-none"
              />
            ) : priceDisplay.kind === "loading" ? (
              <span className="text-base font-medium text-on-surface-variant">
                {t("priceLoading")}
              </span>
            ) : priceDisplay.kind === "login" ? (
              <span className="inline-flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2">
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
            ) : (
              <span className="text-base font-medium text-on-surface-variant">
                {t("priceOnRequest")}
              </span>
            )}
          </div>
        </div>
        {stock.level !== "unknown" ? (
          <div className="sm:text-right max-w-full sm:max-w-[260px]">
            <StockBadge
              level={stock.level as Exclude<StockLevel, "unknown">}
              label={stockLabel}
              size="md"
            />
            {typeof stock.qty === "number" && stock.level === "low" ? (
              <p className="text-xs text-warning mt-1 leading-relaxed text-pretty">
                {t("lowStockRemaining", { qty: stock.qty })}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {canAddToCart ? (
          <div className="flex flex-col gap-3">
            {supportedOptions.length > 0 ? (
              <div className="rounded-(--radius-input) border border-outline-variant/40 bg-surface-container-low p-3">
                <ProductCustomOptions
                  options={product.options ?? []}
                  value={optionSelection}
                  onChange={handleOptionChange}
                  missingOptionIds={missingOptionIds}
                  hidePrices={hideCatalogPrices}
                />
                {!hideCatalogPrices && optionsSurcharge > 0 ? (
                  <div className="mt-3 flex items-baseline justify-between border-t border-outline-variant/40 pt-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                      {t("options.optionsTotal")}
                    </span>
                    <span className="text-sm font-bold text-on-surface">
                      {formatMoney(currentUnitPrice)}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="flex items-stretch gap-2 min-h-[60px]">
              <div
                className="flex items-center bg-surface-container-lowest border border-[rgba(193,199,209,0.3)] shrink-0"
                style={{ borderRadius: "var(--radius-btn)" }}
              >
                <button
                  type="button"
                  onClick={() => stepQty(-1)}
                  disabled={isLoading || qty <= 1}
                  aria-label={t("decreaseQuantity")}
                  className="flex items-center justify-center w-10 h-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <input
                  type="number"
                  min={1}
                  value={inputVal}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  className="w-10 text-center text-sm font-medium bg-transparent border-0 border-x border-x-[rgba(193,199,209,0.3)] focus:outline-none py-1 text-on-surface disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label={t("qty")}
                />
                <button
                  type="button"
                  onClick={() => stepQty(1)}
                  disabled={isLoading}
                  aria-label={t("increaseQuantity")}
                  className="flex items-center justify-center w-10 h-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className={`flex-1 min-h-[60px] px-3 py-2 flex items-center justify-center gap-2 text-center text-white font-bold text-sm sm:text-base leading-tight transition-all disabled:cursor-not-allowed ${
                  isSuccess
                    ? "bg-green-600"
                    : "bg-secondary hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                }`}
                style={{ borderRadius: "var(--radius-btn)" }}
              >
                {isLoading ? (
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ) : isSuccess ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                )}
                <span className="line-clamp-2 text-pretty">
                  {isLoading ? t("adding") : isSuccess ? t("added") : t("addToCart")}
                </span>
              </button>
            </div>
            <WatchlistButton
              variant="full"
              sku={product.sku}
              name={product.name}
              imageUrl={watchlistImageUrl}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {stock.level === "out" ? (
              <span className="inline-flex items-center justify-center rounded-full bg-red-600/10 px-2.5 py-2 text-xs font-medium text-red-700">
                {t("outOfStock")}
              </span>
            ) : null}
            <WatchlistButton
              variant="full"
              sku={product.sku}
              name={product.name}
              imageUrl={watchlistImageUrl}
              className="min-h-[52px]"
            />
            {hideCatalogPrices ? (
              <Link
                href="/account/login"
                className="text-center text-sm font-bold text-secondary underline"
              >
                {t("signInForPrices")}
              </Link>
            ) : null}
          </div>
        )}

        {status === "error" ? (
          <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
        ) : null}
      </div>
    </div>
  );
}
