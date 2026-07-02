"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { StockLevel } from "@/lib/stock";
import { useCart } from "@/components/CartProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useCustomerSession } from "@/components/CustomerSessionProvider";
import StockBadge from "@/components/ui/StockBadge";
import ProductCustomOptions from "@/components/ui/ProductCustomOptions";
import {
  buildCustomOptionsPayload,
  getMissingRequiredOptions,
  getSupportedOptions,
  type CustomOptionSelectionState,
} from "@/lib/custom-options";
import type { MagentoProductOption } from "@/types/magento";

interface CopilotProductDto {
  sku: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stockLevel: StockLevel;
  options?: MagentoProductOption[];
}

type LoadState = "loading" | "ready" | "error";
type AddStatus = "idle" | "loading" | "success" | "error";

export default function CopilotProductWidget({ sku }: { sku: string }) {
  const tc = useTranslations("copilot");
  const tp = useTranslations("products");
  const locale = useLocale();
  const { formatPrice } = useCurrency();
  const { addBySku } = useCart();
  const { isAuthenticated } = useCustomerSession();
  const [state, setState] = useState<LoadState>("loading");
  const [product, setProduct] = useState<CopilotProductDto | null>(null);
  const [qty, setQty] = useState(1);
  const [addStatus, setAddStatus] = useState<AddStatus>("idle");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [optionSelection, setOptionSelection] =
    useState<CustomOptionSelectionState>({});
  const [missingOptionIds, setMissingOptionIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/copilot/product?sku=${encodeURIComponent(sku)}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          if (process.env.NODE_ENV === "development") {
            const detail = await res.text().catch(() => "");
            console.warn("Copilot product fetch failed", {
              sku,
              status: res.status,
              detail: detail.slice(0, 300),
            });
          }
          if (!cancel) {
            setProduct(null);
            setState("error");
          }
          return;
        }
        const data = (await res.json()) as CopilotProductDto;
        if (!cancel) {
          setProduct(data);
          setState("ready");
        }
      } catch {
        if (!cancel) {
          setProduct(null);
          setState("error");
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [sku]);

  const supportedOptions = product
    ? getSupportedOptions(product.options)
    : [];
  const hasOptions = supportedOptions.length > 0;

  const handleOptionChange = useCallback(
    (optionId: string, next: string | string[]) => {
      setOptionSelection((prev) => ({ ...prev, [optionId]: next }));
      if (missingOptionIds.has(optionId)) {
        setMissingOptionIds((prev) => {
          const updated = new Set(prev);
          updated.delete(optionId);
          return updated;
        });
      }
    },
    [missingOptionIds],
  );

  const handleAdd = useCallback(async () => {
    if (!product || product.price <= 0 || product.stockLevel === "out")
      return;
    if (!isAuthenticated) return;
    if (addStatus === "loading") return;

    if (hasOptions && !optionsOpen) {
      setOptionsOpen(true);
      return;
    }

    if (hasOptions) {
      const missing = getMissingRequiredOptions(
        product.options,
        optionSelection,
      );
      if (missing.length > 0) {
        setMissingOptionIds(
          new Set(missing.map((o) => String(o.option_id))),
        );
        setAddStatus("error");
        window.setTimeout(() => setAddStatus("idle"), 2400);
        return;
      }
    }

    const customOptions = buildCustomOptionsPayload(
      product.options,
      optionSelection,
    );

    setAddStatus("loading");
    try {
      await addBySku(
        product.sku,
        qty,
        customOptions.length > 0 ? customOptions : undefined,
      );
      setAddStatus("success");
      window.setTimeout(() => setAddStatus("idle"), 1600);
    } catch {
      setAddStatus("error");
      window.setTimeout(() => setAddStatus("idle"), 2400);
    }
  }, [
    product,
    qty,
    addBySku,
    addStatus,
    isAuthenticated,
    hasOptions,
    optionsOpen,
    optionSelection,
  ]);

  if (state === "loading") {
    return (
      <div className="rounded-[var(--radius-card)] border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs text-on-surface-variant">
        {tc("productLoading")}
      </div>
    );
  }

  if (state === "error" || !product) {
    return (
      <div className="rounded-[var(--radius-card)] border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs text-error">
        {tc("productNotFound", { sku })}
      </div>
    );
  }

  const href = `/products/${encodeURIComponent(product.sku)}`;
  const stockLabel = getStockLabel(product.stockLevel, (key) =>
    tp(key as "inStock" | "lowStock" | "outOfStock"),
  );
  const showCatalogPrice = isAuthenticated || product.price <= 0;
  const showAddToCart =
    isAuthenticated &&
    product.stockLevel !== "out" &&
    product.price > 0;

  const addButtonLabel =
    addStatus === "loading"
      ? tc("addingToCart")
      : addStatus === "success"
        ? tc("addToCartSuccess")
        : addStatus === "error"
          ? tc("addToCartFailed")
          : hasOptions && !optionsOpen
            ? tc("widgetSelectOptions")
            : tc("widgetAddToCart");

  return (
    <div
      className="rounded-[var(--radius-card)] border border-outline-variant/40 bg-surface-container-lowest p-3 shadow-[var(--shadow-ambient)]"
      style={{ borderRadius: "var(--radius-card)" }}
    >
      <div className="flex gap-3">
        <Link
          href={href}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-btn)] bg-surface-container-low"
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="80px"
              className="object-contain p-1"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-on-surface-variant/50">
              —
            </div>
          )}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wide text-on-surface-variant">
              {product.sku}
            </span>
            {product.stockLevel !== "unknown" && (
              <StockBadge
                level={product.stockLevel}
                label={stockLabel}
                size="sm"
              />
            )}
          </div>
          <Link
            href={href}
            className="line-clamp-2 text-sm font-semibold text-primary hover:underline"
          >
            {product.name}
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-2 pt-1">
            <span className="text-base font-bold tabular-nums text-on-surface">
              {!showCatalogPrice && product.price > 0 ? (
                <span className="text-sm font-normal text-on-surface-variant">
                  {tp("pricesLoginRequired")}{" "}
                  <Link
                    href="/account/login"
                    className="font-bold text-secondary underline"
                  >
                    {tp("signInForPrices")}
                  </Link>
                </span>
              ) : product.price > 0 ? (
                formatPrice(product.price, locale)
              ) : (
                tp("priceOnRequest")
              )}
            </span>
          </div>
          {optionsOpen && hasOptions ? (
            <div className="rounded-[var(--radius-input)] border border-outline-variant/40 bg-surface-container-low p-3">
              <p className="mb-3 text-xs text-on-surface-variant">
                {tc("widgetConfigureHint")}
              </p>
              <ProductCustomOptions
                options={product.options ?? []}
                value={optionSelection}
                onChange={handleOptionChange}
                missingOptionIds={missingOptionIds}
              />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/25 pt-2">
            <div className="flex items-center rounded-[var(--radius-btn)] border border-outline-variant bg-surface-container-lowest">
              <button
                type="button"
                className="px-2 py-1 text-sm text-on-surface hover:bg-surface-container-highest disabled:opacity-40"
                aria-label={tc("qtyDecrease")}
                disabled={qty <= 1 || (!isAuthenticated && product.price > 0)}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="min-w-9 px-2 text-center text-sm tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                className="px-2 py-1 text-sm text-on-surface hover:bg-surface-container-highest disabled:opacity-40"
                aria-label={tc("qtyIncrease")}
                disabled={
                  qty >= 99 ||
                  product.stockLevel === "out" ||
                  (!isAuthenticated && product.price > 0)
                }
                onClick={() => setQty((q) => Math.min(99, q + 1))}
              >
                +
              </button>
            </div>
            {showAddToCart && (
                <button
                  type="button"
                  onClick={() => void handleAdd()}
                  disabled={addStatus === "loading"}
                  className={`rounded-[var(--radius-btn)] px-4 py-2 text-xs font-semibold text-on-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    addStatus === "success"
                      ? "bg-secondary"
                      : addStatus === "error"
                        ? "bg-error"
                        : "bg-secondary hover:brightness-110"
                  }`}
                >
                  {addButtonLabel}
                </button>
              )}
            {!showAddToCart &&
              !isAuthenticated &&
              product.price > 0 &&
              product.stockLevel !== "out" && (
                <Link
                  href="/account/login"
                  className="rounded-[var(--radius-btn)] px-4 py-2 text-xs font-semibold text-white bg-primary hover:brightness-110 transition-colors"
                >
                  {tp("signInToAddToCart")}
                </Link>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStockLabel(
  level: StockLevel,
  t: (key: "inStock" | "lowStock" | "outOfStock") => string,
): string {
  switch (level) {
    case "in":
      return t("inStock");
    case "low":
      return t("lowStock");
    case "out":
      return t("outOfStock");
    case "unknown":
    default:
      return t("inStock");
  }
}
