"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/CartProvider";
import { useCustomerSession } from "@/components/CustomerSessionProvider";
import ProductGallery from "@/components/ui/ProductGallery";
import ProductInformation from "@/components/product/ProductInformation";
import StockBadge from "@/components/ui/StockBadge";
import WatchlistButton from "@/components/WatchlistButton";
import VariantPicker, {
  type VariantSelection,
} from "@/components/product/VariantPicker";
import { useErpPrice } from "@/components/product/useErpPrice";
import {
  findVariant,
  type ConfigurableData,
  type ConfigurableOption,
} from "@/lib/configurable-shared";
import { formatErpPrice } from "@/lib/erp-shared";
import { sanitizeProductHtml } from "@/lib/sanitize-html";
import { notify } from "@/lib/toast";
import type { MagentoConfigurableItemOption, MagentoProduct } from "@/types/magento";

interface ConfigurableProductViewProps {
  parent: MagentoProduct;
  configurable: ConfigurableData;
  /** Parent Magento gallery as fallback before a variant is selected. */
  parentGalleryUrls: string[];
}

type Status = "idle" | "loading" | "success" | "error";

function buildInitialSelection(
  options: ConfigurableOption[],
): VariantSelection {
  // Preselect only when every option has exactly one value.
  if (options.every((o) => o.values.length === 1)) {
    const selection: VariantSelection = {};
    for (const o of options) {
      selection[o.attributeCode] = o.values[0].valueIndex;
    }
    return selection;
  }
  return {};
}

function selectionComplete(
  options: ConfigurableOption[],
  selection: VariantSelection,
): boolean {
  return options.every((o) => selection[o.attributeCode] != null);
}

function PriceSpinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin motion-reduce:animate-none ${className}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export default function ConfigurableProductView({
  parent,
  configurable,
  parentGalleryUrls,
}: ConfigurableProductViewProps) {
  const t = useTranslations("products");
  const locale = useLocale();
  const { isAuthenticated } = useCustomerSession();
  const { addItem } = useCart();

  const [selection, setSelection] = useState<VariantSelection>(() =>
    buildInitialSelection(configurable.options),
  );
  const [qty, setQty] = useState(1);
  const [inputVal, setInputVal] = useState("1");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const complete = selectionComplete(configurable.options, selection);
  const variant = complete
    ? findVariant(configurable.variants, selection)
    : null;

  const erpPrice = useErpPrice(variant?.sku ?? null, qty);
  const priceLoading =
    isAuthenticated &&
    complete &&
    variant != null &&
    (erpPrice.state === "loading" || erpPrice.state === "idle");
  const hasStaleAmount =
    erpPrice.netAmount != null && Number.isFinite(erpPrice.netAmount);

  const displayName = variant?.name ?? parent.name;
  const displaySku = variant?.sku ?? parent.sku;
  const galleryUrls =
    variant && variant.galleryUrls.length > 0
      ? variant.galleryUrls
      : parentGalleryUrls;
  const galleryImages = galleryUrls.map((src) => ({
    src,
    alt: displayName,
  }));

  const descriptionHtml = useMemo(() => {
    const raw = variant?.descriptionHtml;
    if (!raw) return null;
    return sanitizeProductHtml(raw);
  }, [variant?.descriptionHtml]);

  const shortDescriptionHtml = useMemo(() => {
    const raw = variant?.shortDescriptionHtml;
    if (!raw) return null;
    return sanitizeProductHtml(raw);
  }, [variant?.shortDescriptionHtml]);

  const priceNode = (() => {
    if (!complete || !variant) {
      return (
        <span className="text-base font-medium text-on-surface-variant">
          {t("variantSelectForPrice")}
        </span>
      );
    }
    if (!isAuthenticated || erpPrice.state === "no_customer") {
      return (
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
      );
    }
    if (priceLoading) {
      if (hasStaleAmount) {
        return (
          <span
            className="inline-flex items-center gap-2"
            role="status"
            aria-live="polite"
          >
            <span className="text-3xl sm:text-4xl font-black text-on-surface leading-none opacity-50 transition-opacity duration-200">
              {formatErpPrice(
                erpPrice.netAmount!,
                erpPrice.currency ?? "EUR",
                locale,
              )}
              <span className="ml-2 text-sm font-normal text-on-surface-variant">
                {t("exclVat")}
              </span>
            </span>
            <PriceSpinner className="text-on-surface-variant shrink-0" />
            <span className="sr-only">{t("priceUpdating")}</span>
          </span>
        );
      }
      return (
        <span
          className="inline-flex items-center"
          role="status"
          aria-live="polite"
        >
          <span
            className="h-9 w-40 rounded-(--radius-btn) bg-surface-container-highest animate-pulse motion-reduce:animate-none"
            aria-hidden
          />
          <span className="sr-only">{t("priceLoading")}</span>
        </span>
      );
    }
    if (
      erpPrice.state === "priced" &&
      erpPrice.netAmount != null &&
      Number.isFinite(erpPrice.netAmount)
    ) {
      return (
        <span className="text-3xl sm:text-4xl font-black text-on-surface leading-none">
          {formatErpPrice(
            erpPrice.netAmount,
            erpPrice.currency ?? "EUR",
            locale,
          )}
          <span className="ml-2 text-sm font-normal text-on-surface-variant">
            {t("exclVat")}
          </span>
        </span>
      );
    }
    return (
      <span className="text-base font-medium text-on-surface-variant">
        {t("priceOnRequest")}
      </span>
    );
  })();

  const canAddToCart =
    complete &&
    variant != null &&
    !variant.isDiscontinued &&
    erpPrice.state === "priced" &&
    erpPrice.netAmount != null;

  const ctaDisabled = !canAddToCart || status === "loading";
  const ctaReason = (() => {
    if (!complete) return t("variantSelectToAdd");
    if (variant?.isDiscontinued) return t("discontinued");
    if (!isAuthenticated || erpPrice.state === "no_customer") {
      return t("signInForPrices");
    }
    if (priceLoading) return t("priceLoading");
    if (!canAddToCart) return t("priceOnRequest");
    return undefined;
  })();

  const ctaLabel = (() => {
    if (status === "loading") return t("adding");
    if (status === "success") return t("added");
    return t("addToCart");
  })();

  const configurableOptions: MagentoConfigurableItemOption[] =
    configurable.options.map((opt) => ({
      option_id: opt.attributeId,
      option_value: selection[opt.attributeCode],
    }));

  function stepQty(delta: number) {
    const next = Math.max(1, qty + delta);
    setQty(next);
    setInputVal(String(next));
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

  async function handleAddToCart() {
    if (!canAddToCart || status === "loading") return;
    if (!selectionComplete(configurable.options, selection)) {
      setStatus("error");
      setErrorMsg(t("variantIncomplete"));
      notify.error(t("variantIncomplete"));
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    try {
      await addItem(parent, qty, { configurableOptions });
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
  const qtyDisabled = isLoading || !canAddToCart;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
      <div className="w-full lg:w-[376px] lg:shrink-0">
        <ProductGallery
          images={galleryImages}
          productName={displayName}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-black text-primary uppercase tracking-[-0.02em] leading-tight">
            {displayName}
          </h1>
          <p className="text-xs text-on-surface-variant mt-2 font-mono">
            {t("skuLabel")}: {displaySku}
          </p>
          {variant?.isDiscontinued ? (
            <p className="mt-2 text-sm font-semibold text-warning">
              {t("discontinued")}
            </p>
          ) : null}
          {shortDescriptionHtml ? (
            <div
              className="mt-3 text-sm text-on-surface-variant leading-relaxed"
              dangerouslySetInnerHTML={{ __html: shortDescriptionHtml }}
            />
          ) : null}
        </div>

        <div
          className="bg-surface-container-lowest shadow-ambient p-6 flex flex-col gap-6"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <VariantPicker
            options={configurable.options}
            variants={configurable.variants}
            selection={selection}
            onChange={setSelection}
            busy={priceLoading}
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant mb-1">
                {t("standardPrice")}
              </p>
              <div className="flex min-h-11 flex-wrap items-baseline gap-x-2 gap-y-1">
                {priceNode}
              </div>
            </div>
            {variant ? (
              <div className="sm:text-right max-w-full sm:max-w-[260px]">
                <StockBadge
                  level="in"
                  label={t("inStock")}
                  size="md"
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-stretch gap-2 min-h-[60px]">
              <div
                className="flex items-center bg-surface-container-lowest border border-[rgba(193,199,209,0.3)] shrink-0"
                style={{ borderRadius: "var(--radius-btn)" }}
              >
                <button
                  type="button"
                  onClick={() => stepQty(-1)}
                  disabled={qtyDisabled || qty <= 1}
                  aria-label={t("decreaseQuantity")}
                  className="flex items-center justify-center w-10 h-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
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
                  disabled={qtyDisabled}
                  className="w-10 text-center text-sm font-medium bg-transparent border-0 border-x border-x-[rgba(193,199,209,0.3)] focus:outline-none py-1 text-on-surface disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label={t("qty")}
                />
                <button
                  type="button"
                  onClick={() => stepQty(1)}
                  disabled={qtyDisabled}
                  aria-label={t("increaseQuantity")}
                  className="flex items-center justify-center w-10 h-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={ctaDisabled}
                aria-disabled={ctaDisabled}
                aria-busy={priceLoading || isLoading || undefined}
                title={ctaReason}
                className={`flex-1 min-h-[60px] px-3 py-2 flex items-center justify-center gap-2 text-center text-white font-bold text-sm sm:text-base leading-tight transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSuccess
                    ? "bg-green-600"
                    : "bg-secondary hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] enabled:cursor-pointer"
                }`}
                style={{ borderRadius: "var(--radius-btn)" }}
              >
                {priceLoading && complete ? (
                  <PriceSpinner />
                ) : null}
                <span className="line-clamp-2 text-pretty">{ctaLabel}</span>
              </button>
            </div>

            {!complete ? (
              <p className="text-sm text-on-surface-variant">
                {t("variantSelectToAdd")}
              </p>
            ) : variant?.isDiscontinued ? (
              <p className="text-sm text-on-surface-variant">{t("discontinued")}</p>
            ) : complete &&
              isAuthenticated &&
              !priceLoading &&
              !canAddToCart ? (
              <p className="text-sm text-on-surface-variant">
                {t("priceOnRequest")}
              </p>
            ) : null}

            <WatchlistButton
              variant="full"
              sku={parent.sku}
              name={displayName}
              imageUrl={galleryUrls[0] ?? null}
            />

            {complete && !isAuthenticated ? (
              <Link
                href="/account/login"
                className="text-center text-sm font-bold text-secondary underline"
              >
                {t("signInForPrices")}
              </Link>
            ) : null}
          </div>

          {status === "error" && errorMsg ? (
            <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
          ) : null}
        </div>

        <ProductInformation features={variant?.pimFeatures ?? []} />

        {descriptionHtml ? (
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-4">
              {t("description")}
            </h2>
            <div
              className="text-sm text-on-surface-variant leading-relaxed"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
