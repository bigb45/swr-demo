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
import StockBadge from "@/components/ui/StockBadge";

type AddStatus = "idle" | "loading" | "success" | "error";

export default function ProductSearchResultRow({
  product,
}: {
  product: MagentoProduct;
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
  const typeLabel = product.type_id
    ? product.type_id.replace(/_/g, " ")
    : null;

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
    <article
      className="bg-surface-container-lowest rounded-[5px] p-4 sm:p-5 shadow-[0_10px_30px_rgba(26,28,28,0.06)]"
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
        <Link
          href={href}
          className="relative shrink-0 w-full max-w-[200px] sm:w-[140px] sm:max-w-none aspect-square sm:h-[140px] bg-surface-container-low rounded-card overflow-hidden flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-primary self-center sm:self-start"
          aria-label={tSearch("openProduct", { name: product.name })}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 200px, 140px"
              className="object-contain p-3"
            />
          ) : (
            <svg
              className="w-14 h-14 text-outline-variant"
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

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              {product.sku}
            </span>
            {stock.level !== "unknown" && (
              <StockBadge level={stock.level} label={stockLabel} />
            )}
          </div>

          <Link
            href={href}
            className="text-base font-semibold text-on-surface line-clamp-2 hover:text-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            {product.name}
          </Link>

          {(typeLabel != null && typeLabel.length > 0) ||
          product.weight != null ? (
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
              {typeLabel != null && typeLabel.length > 0 ? (
                <div className="flex gap-1.5 items-baseline min-w-0">
                  <dt className="shrink-0 font-semibold uppercase tracking-[0.05em] text-on-surface-variant/90">
                    {tProducts("productType")}
                  </dt>
                  <dd className="capitalize min-w-0">{typeLabel}</dd>
                </div>
              ) : null}
              {product.weight != null ? (
                <div className="flex gap-1.5 items-baseline min-w-0">
                  <dt className="shrink-0 font-semibold uppercase tracking-[0.05em] text-on-surface-variant/90">
                    {tProducts("weight")}
                  </dt>
                  <dd className="tabular-nums">{product.weight} kg</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {shortDescription ? (
            <div
              className="text-sm text-on-surface-variant line-clamp-4 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: shortDescription }}
            />
          ) : null}
        </div>

        <div className="shrink-0 flex flex-row sm:flex-col justify-between sm:justify-start items-stretch sm:items-end gap-3 pt-1 sm:pt-0 border-t border-surface-container-highest sm:border-t-0">
          <div className="flex flex-col gap-1 min-w-0 sm:text-right">
            <p className="text-base font-bold text-primary tabular-nums">
              {showGuestPriceGate ? (
                <span className="font-normal text-sm text-on-surface-variant text-left sm:text-right">
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
          </div>

          <div className="flex flex-col justify-center">
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
              <span className="text-xs text-on-surface-variant max-w-36 sm:text-right leading-snug">
                {tProducts("priceOnRequest")}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
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
