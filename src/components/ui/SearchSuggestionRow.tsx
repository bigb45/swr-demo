"use client";

import Image from "next/image";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { MagentoProduct } from "@/types/magento";
import { getProductImageUrl, getCustomAttribute } from "@/lib/magento-shared";
import { getStockStatus, type StockLevel } from "@/lib/stock";
import { useCurrency } from "@/components/CurrencyProvider";
import { useCart } from "@/components/CartProvider";
import { useCustomerSession } from "@/components/CustomerSessionProvider";

type AddStatus = "idle" | "loading" | "success" | "error";

export default function SearchSuggestionRow({
  product,
  optionId,
  highlighted,
}: {
  product: MagentoProduct;
  optionId: string;
  highlighted: boolean;
}) {
  const imageUrl = getProductImageUrl(product);
  const shortDescription = getCustomAttribute(product, "short_description");
  const { formatPrice } = useCurrency();
  const { isAuthenticated } = useCustomerSession();
  const locale = useLocale();
  const tProducts = useTranslations("products");
  const tSearch = useTranslations("search");
  const { addItem } = useCart();
  const [status, setStatus] = useState<AddStatus>("idle");

  const stock = getStockStatus(product);
  const canAdd = isAuthenticated && product.price > 0 && stock.level !== "out";
  const showGuestPriceGate = !isAuthenticated && product.price > 0;
  const stockLabel = getStockLabel(stock.level, tProducts);

  const href = `/products/${encodeURIComponent(product.sku)}`;

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!canAdd || status === "loading") return;

    setStatus("loading");
    try {
      await addItem(product, 1);
      setStatus("success");
      window.setTimeout(() => setStatus("idle"), 1600);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2400);
    }
  }

  return (
    <li
      role="option"
      id={optionId}
      aria-selected={highlighted}
      className={`border-b border-surface-container-highest last:border-b-0 ${
        highlighted ? "bg-surface-container-low" : ""
      }`}
    >
      <div className="flex gap-2 sm:gap-3 p-3 items-stretch">
        <Link
          href={href}
          tabIndex={-1}
          className="relative shrink-0 w-[72px] h-[72px] sm:w-[100px] sm:h-[100px] bg-surface-container-low rounded-card overflow-hidden flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={tSearch("openProduct", { name: product.name })}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="100px"
              className="object-contain p-2"
            />
          ) : (
            <svg
              className="w-10 h-10 text-outline-variant"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </Link>

        <div className="flex-1 min-w-0 flex flex-col gap-1 py-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              {product.sku}
            </span>
            {stock.level !== "unknown" && stock.level !== "out" && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                {stockLabel}
              </span>
            )}
          </div>
          <Link
            href={href}
            className="text-sm font-semibold text-on-surface line-clamp-2 hover:text-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            {product.name}
          </Link>
          <p className="text-sm font-bold text-primary tabular-nums">
            {showGuestPriceGate ? (
              <span className="font-normal text-on-surface-variant">
                {tProducts("pricesLoginRequired")}{" "}
                <Link
                  href="/account/login"
                  className="font-bold text-secondary underline"
                >
                  {tProducts("signInForPrices")}
                </Link>
              </span>
            ) : product.price > 0 ? (
              formatPrice(product.price, locale)
            ) : (
              tProducts("priceOnRequest")
            )}
          </p>
          {shortDescription ? (
            <div
              className="text-xs text-on-surface-variant line-clamp-2 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: shortDescription }}
            />
          ) : null}
        </div>

        <div className="shrink-0 flex flex-col justify-center self-center gap-2">
          {canAdd ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={status === "loading"}
              aria-label={tProducts("addToCart")}
              className={`px-3 py-2 text-xs font-bold tracking-wide text-white rounded-[3px] transition-all whitespace-nowrap disabled:cursor-not-allowed ${
                status === "success"
                  ? "bg-secondary"
                  : status === "error"
                    ? "bg-red-600"
                    : "bg-primary hover:brightness-110"
              }`}
            >
              {status === "loading" ? (
                <svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-spin mx-auto"
                  aria-hidden
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : status === "success" ? (
                "✓"
              ) : status === "error" ? (
                "!"
              ) : (
                tProducts("addToCart")
              )}
            </button>
          ) : showGuestPriceGate && stock.level !== "out" ? (
            <Link
              href="/account/login"
              className="px-3 py-2 text-xs font-bold tracking-wide text-white rounded-[3px] bg-primary hover:brightness-110 transition-all whitespace-nowrap text-center"
            >
              {tProducts("signInForPrices")}
            </Link>
          ) : stock.level === "out" ? (
            <span className="inline-flex items-center justify-center rounded-full bg-red-600/10 px-2.5 py-1 text-xs font-medium text-red-700 whitespace-nowrap">
              {tProducts("outOfStock")}
            </span>
          ) : (
            <span className="text-xs text-on-surface-variant max-w-28 text-right leading-snug">
              {tProducts("priceOnRequest")}
            </span>
          )}
        </div>
      </div>
    </li>
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
