"use client";

import Image from "next/image";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { MagentoProduct } from "@/types/magento";
import { getProductImageUrl, getCustomAttribute } from "@/lib/magento-shared";
import { getSupportedOptions } from "@/lib/custom-options";
import { getDisplayShortDescription } from "@/lib/product-display";
import NoImagePlaceholder from "@/components/ui/NoImagePlaceholder";
import { getStockStatus, type StockLevel } from "@/lib/stock";
import { notify } from "@/lib/toast";
import { useCurrency } from "@/components/CurrencyProvider";
import { useCart } from "@/components/CartProvider";
import { useCustomerSession } from "@/components/CustomerSessionProvider";
import WatchlistButton from "@/components/WatchlistButton";
import StockBadge from "@/components/ui/StockBadge";

type AddStatus = "idle" | "loading" | "success" | "error";

export default function ProductSearchResultRow({
  product,
}: {
  product: MagentoProduct;
}) {
  const imageUrl = getProductImageUrl(product);
  const shortDescription = getDisplayShortDescription(
    getCustomAttribute(product, "short_description"),
  );
  const { formatPrice } = useCurrency();
  const { isAuthenticated } = useCustomerSession();
  const locale = useLocale();
  const tProducts = useTranslations("products");
  const tCart = useTranslations("cart");
  const tSearch = useTranslations("search");
  const { addItem } = useCart();
  const [status, setStatus] = useState<AddStatus>("idle");
  const [qty, setQty] = useState(1);

  const stock = getStockStatus(product);
  const maxQty =
    typeof stock.qty === "number" && stock.qty > 0 ? Math.floor(stock.qty) : null;
  // Guests may add to cart (prices stay hidden; checkout requires sign-in).
  const canAddToCart = product.price > 0 && stock.level !== "out";
  // Products with required custom options must be configured on the PDP
  // before adding — same guard as ProductCard.
  const hasRequiredOptions = getSupportedOptions(product.options).some(
    (option) => option.is_require,
  );
  const shouldConfigureBeforeAdd = canAddToCart && hasRequiredOptions;
  const showGuestPriceGate = !isAuthenticated && product.price > 0;
  const stockLabel = getStockLabel(stock.level, tProducts);

  const href = `/products/${encodeURIComponent(product.sku)}`;
  const typeLabel = product.type_id
    ? product.type_id.replace(/_/g, " ")
    : null;

  function updateQty(next: number) {
    const clamped = Math.max(1, Math.min(maxQty ?? 9999, Math.floor(next)));
    setQty(Number.isFinite(clamped) ? clamped : 1);
  }

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!canAddToCart || shouldConfigureBeforeAdd || status === "loading") return;

    setStatus("loading");
    try {
      await addItem(product, qty);
      setStatus("success");
      notify.success(tProducts("added"));
      window.setTimeout(() => setStatus("idle"), 1600);
    } catch {
      setStatus("error");
      notify.error(tCart("updateError"));
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
            <NoImagePlaceholder variant="card" />
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

          <div className="flex flex-col justify-center gap-2">
            {shouldConfigureBeforeAdd ? (
              <div className="flex items-center gap-2 self-start sm:self-end">
                <WatchlistButton
                  variant="icon"
                  size="sm"
                  sku={product.sku}
                  name={product.name}
                  imageUrl={imageUrl}
                />
                <Link
                  href={href}
                  className="px-3 py-2 text-xs font-bold tracking-wide text-white rounded-[3px] bg-primary hover:brightness-110 transition-all whitespace-nowrap"
                >
                  {tProducts("selectOptions")}
                </Link>
              </div>
            ) : canAddToCart ? (
              <>
                <div className="inline-flex h-9 items-center self-start sm:self-end rounded-[3px] bg-surface-container-low">
                  <button
                    type="button"
                    onClick={() => updateQty(qty - 1)}
                    disabled={qty <= 1 || status === "loading"}
                    aria-label={tProducts("decreaseQuantity")}
                    className="flex h-9 w-8 items-center justify-center text-primary disabled:opacity-40"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={maxQty ?? undefined}
                    value={qty}
                    onChange={(e) => updateQty(Number(e.target.value))}
                    disabled={status === "loading"}
                    aria-label={tProducts("quantity")}
                    className="h-9 w-11 bg-transparent text-center text-sm font-bold tabular-nums text-on-surface outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateQty(qty + 1)}
                    disabled={(maxQty !== null && qty >= maxQty) || status === "loading"}
                    aria-label={tProducts("increaseQuantity")}
                    className="flex h-9 w-8 items-center justify-center text-primary disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-end">
                  <WatchlistButton
                    variant="icon"
                    size="sm"
                    sku={product.sku}
                    name={product.name}
                    imageUrl={imageUrl}
                  />
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
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 self-start sm:self-end sm:items-end">
                {stock.level === "out" ? (
                  <span className="inline-flex items-center justify-center rounded-full bg-red-600/10 px-2.5 py-1 text-xs font-medium text-red-700 whitespace-nowrap">
                    {tProducts("outOfStock")}
                  </span>
                ) : null}
                <WatchlistButton
                  variant="full"
                  sku={product.sku}
                  name={product.name}
                  imageUrl={imageUrl}
                  className="sm:w-auto sm:px-4 whitespace-nowrap"
                />
              </div>
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
