"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/CartProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useCustomerSession } from "@/components/CustomerSessionProvider";
import WatchlistButton from "@/components/WatchlistButton";
import ProductCustomOptions from "@/components/ui/ProductCustomOptions";
import { getProductImageUrl } from "@/lib/magento-shared";
import {
  buildCustomOptionsPayload,
  getMissingRequiredOptions,
  getSupportedOptions,
  isSelectOption,
  type CustomOptionSelectionState,
} from "@/lib/custom-options";
import type { MagentoProduct } from "@/types/magento";
import { notify } from "@/lib/toast";
import { getStockStatus } from "@/lib/stock";

interface AddToCartClusterProps {
  product: MagentoProduct;
}

type Status = "idle" | "loading" | "success" | "error";

export default function AddToCartCluster({
  product,
}: AddToCartClusterProps) {
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
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

  const supportedOptions = getSupportedOptions(product.options);
  const stock = getStockStatus(product);

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
          ? (product.price * value.price) / 100
          : value.price;
    }
    return sum;
  }, 0);

  const sortedTiers = [...(product.tier_prices ?? [])].sort(
    (a, b) => a.qty - b.qty,
  );
  const hideCatalogPrices = !isAuthenticated && product.price > 0;
  const canAddToCart = product.price > 0 && stock.level !== "out";
  const watchlistImageUrl = getProductImageUrl(product);

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
        customOptions.length > 0 ? customOptions : undefined,
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
  const activeTier = sortedTiers.reduce<typeof sortedTiers[number] | undefined>(
    (best, tier) => (qty >= tier.qty ? tier : best),
    undefined
  );
  const nextTier = sortedTiers.find((tier) => qty < tier.qty);
  const currentUnitPrice = activeTier?.value ?? product.price;
  const hasActiveDiscount =
    product.price > 0 && currentUnitPrice > 0 && currentUnitPrice < product.price;
  const currentSavings =
    activeTier?.extension_attributes?.percentage_value ??
    (hasActiveDiscount
      ? Math.round(((product.price - currentUnitPrice) / product.price) * 100)
      : undefined);

  const formattedBasePrice =
    product.price > 0 ? formatPrice(product.price, locale) : t("priceOnRequest");
  const formattedCurrentPrice =
    currentUnitPrice > 0
      ? formatPrice(currentUnitPrice, locale)
      : t("priceOnRequest");

  return (
    <div className="flex flex-col gap-2">
      {hideCatalogPrices && sortedTiers.length > 0 ? (
        <div className="rounded-(--radius-input) border border-outline-variant/40 bg-surface-container-low p-3 text-sm text-on-surface-variant">
          <p>{t("pricesLoginRequired")}</p>
          <Link
            href="/account/login"
            className="mt-2 inline-block text-sm font-bold text-secondary underline"
          >
            {t("signInForPrices")}
          </Link>
        </div>
      ) : null}
      {sortedTiers.length > 0 && !hideCatalogPrices && (
        <div className="rounded-(--radius-input) border border-outline-variant/40 bg-surface-container-low p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            {t("bulkPricing")}
          </p>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {hasActiveDiscount && (
              <span className="text-sm text-on-surface-variant line-through decoration-on-surface-variant/70">
                {formattedBasePrice}
              </span>
            )}
            <span className="text-lg font-bold text-on-surface">
              {formattedCurrentPrice}
            </span>
            {currentUnitPrice > 0 && (
              <span className="text-xs text-on-surface-variant">{t("exclVat")}</span>
            )}
            {hasActiveDiscount && currentSavings ? (
              <span className="text-xs font-semibold text-secondary">
                {Math.round(currentSavings)}% {t("savings")}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            {activeTier
              ? nextTier
                ? `${t("bulkPricingUnlocked", { qty: activeTier.qty })} ${t(
                    "bulkPricingHint",
                    {
                      qty: nextTier.qty,
                      price:
                        nextTier.value > 0
                          ? formatPrice(nextTier.value, locale)
                          : t("priceOnRequest"),
                    }
                  )}`
                : t("bulkPricingBestTier")
              : nextTier
                ? t("bulkPricingHint", {
                    qty: nextTier.qty,
                    price:
                      nextTier.value > 0
                        ? formatPrice(nextTier.value, locale)
                        : t("priceOnRequest"),
                  })
                : null}
          </p>
        </div>
      )}

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
                {formatPrice(currentUnitPrice + optionsSurcharge, locale)}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex items-stretch gap-2 min-h-[60px]">
        {/* QTY stepper */}
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

        {/* Add to Cart button */}
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

      {status === "error" && (
        <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
      )}
    </div>
  );
}
