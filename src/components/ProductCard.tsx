"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { MagentoProduct } from "@/types/magento";
import { getCustomAttribute, getProductGalleryUrls, getProductImageUrl } from "@/lib/magento-shared";
import { getDisplayShortDescription } from "@/lib/product-display";
import { getStockStatus, type StockLevel } from "@/lib/stock";
import { notify } from "@/lib/toast";
import { useCurrency } from "./CurrencyProvider";
import { useCart } from "./CartProvider";
import { useCustomerSession } from "./CustomerSessionProvider";
import WatchlistButton from "./WatchlistButton";
import StockBadge from "./ui/StockBadge";
import NoImagePlaceholder from "./ui/NoImagePlaceholder";

interface ProductCardProps {
  product: MagentoProduct;
  priorityImage?: boolean;
}

type AddStatus = "idle" | "loading" | "success" | "error";

function ProductCardGallery({
  product,
  priorityImage = false,
}: {
  product: MagentoProduct;
  priorityImage?: boolean;
}) {
  const t = useTranslations("products");
  const galleryUrls = useMemo(
    () => getProductGalleryUrls(product),
    [product],
  );
  const [imageIndex, setImageIndex] = useState(0);
  const displayUrl = galleryUrls[imageIndex] ?? galleryUrls[0];
  const showGalleryNav = galleryUrls.length > 1;

  function goPrev(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((i) => (i <= 0 ? galleryUrls.length - 1 : i - 1));
  }

  function goNext(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((i) => (i >= galleryUrls.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="relative aspect-square bg-surface-container-low overflow-hidden">
      {displayUrl ? (
        <>
          <Image
            key={`${product.sku}-${imageIndex}`}
            src={displayUrl}
            alt={product.name}
            fill
            priority={priorityImage && imageIndex === 0}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
          {showGalleryNav ? (
            <>
              <div className="absolute inset-y-0 left-0 flex items-center pl-1">
                <button
                  type="button"
                  aria-label={t("galleryPrevImage")}
                  className="flex h-9 w-9 items-center justify-center rounded-(--radius-btn) bg-primary text-white shadow-ambient hover:bg-primary/90 transition-colors"
                  onClick={goPrev}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                <button
                  type="button"
                  aria-label={t("galleryNextImage")}
                  className="flex h-9 w-9 items-center justify-center rounded-(--radius-btn) bg-primary text-white shadow-ambient hover:bg-primary/90 transition-colors"
                  onClick={goNext}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
              {galleryUrls.length <= 8 ? (
                <div
                  className="absolute bottom-2 left-1/2 flex max-w-[calc(100%-2rem)] -translate-x-1/2 gap-1.5 overflow-x-auto rounded-full bg-surface-container-lowest/90 px-2 py-1 shadow-ambient"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  {galleryUrls.map((_, i) => (
                    <button
                      key={`${product.sku}-dot-${i}`}
                      type="button"
                      aria-label={t("galleryGoToImage", { index: i + 1, total: galleryUrls.length })}
                      aria-current={i === imageIndex}
                      className={
                        i === imageIndex
                          ? "h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          : "h-1.5 w-1.5 shrink-0 rounded-full bg-outline-variant hover:bg-on-surface-variant/60"
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImageIndex(i);
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <NoImagePlaceholder variant="card" />
      )}
    </div>
  );
}

export default function ProductCard({ product, priorityImage }: ProductCardProps) {
  const shortDescription = getDisplayShortDescription(
    getCustomAttribute(product, "short_description"),
  );
  const { formatPrice } = useCurrency();
  const { isAuthenticated } = useCustomerSession();
  const { addItem } = useCart();
  const locale = useLocale();
  const t = useTranslations("products");
  const tCart = useTranslations("cart");
  const [status, setStatus] = useState<AddStatus>("idle");
  const [qty, setQty] = useState(1);

  const stock = getStockStatus(product);
  const maxQty =
    typeof stock.qty === "number" && stock.qty > 0 ? Math.floor(stock.qty) : null;
  // Cart is reserved for signed-in customers with a sellable price; everyone
  // else (guests, price-on-request) gets the watchlist instead.
  const canAddToCart =
    isAuthenticated && product.price > 0 && stock.level !== "out";
  const showGuestPriceGate = !isAuthenticated && product.price > 0;
  const stockLabel = getStockLabel(stock.level, t);
  const watchlistImageUrl = getProductImageUrl(product);

  function updateQty(next: number) {
    const clamped = Math.max(1, Math.min(maxQty ?? 9999, Math.floor(next)));
    setQty(Number.isFinite(clamped) ? clamped : 1);
  }

  async function handleAdd() {
    if (!canAddToCart || status === "loading") return;

    setStatus("loading");
    try {
      await addItem(product, qty);
      setStatus("success");
      notify.success(t("added"));
      window.setTimeout(() => setStatus("idle"), 1600);
    } catch {
      setStatus("error");
      notify.error(tCart("updateError"));
      window.setTimeout(() => setStatus("idle"), 2400);
    }
  }

  const href = `/products/${encodeURIComponent(product.sku)}`;

  return (
    <div className="group relative flex flex-col bg-surface-container-lowest rounded-card border border-outline-variant/80 overflow-hidden hover:border-outline-variant transition-all duration-200">
      <Link
        href={href}
        className="flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ProductCardGallery
          key={product.sku}
          product={product}
          priorityImage={priorityImage}
        />

        <div className="flex flex-col flex-1 px-4 pt-4 gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-mono text-on-surface-variant/70 uppercase tracking-wider">
              {product.sku}
            </p>
            {stock.level !== "unknown" && (
              <StockBadge level={stock.level} label={stockLabel} />
            )}
          </div>
          <h3 className="text-sm font-semibold text-primary line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {shortDescription ? (
            <div
              className="text-xs text-on-surface-variant line-clamp-2"
              dangerouslySetInnerHTML={{ __html: shortDescription }}
            />
          ) : null}
        </div>
      </Link>

      <div className="flex flex-col gap-3 p-4 pt-3 mt-auto">
        {showGuestPriceGate ? (
          <div className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="shrink-0 text-on-surface-variant"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>{t("signInForPrice")}</span>
          </div>
        ) : (
          <span className="text-lg font-bold text-primary">
            {product.price > 0
              ? formatPrice(product.price, locale)
              : t("priceOnRequest")}
          </span>
        )}
        {canAddToCart ? (
          <div className="flex items-center justify-between gap-2">
            <div
              className="inline-flex h-10 items-center rounded-(--radius-btn) bg-surface-container-low"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => updateQty(qty - 1)}
                disabled={qty <= 1 || status === "loading"}
                aria-label={t("decreaseQuantity")}
                className="flex h-10 w-9 items-center justify-center text-primary disabled:opacity-40"
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
                aria-label={t("quantity")}
                className="h-10 w-12 bg-transparent text-center text-sm font-bold tabular-nums text-on-surface outline-none"
              />
              <button
                type="button"
                onClick={() => updateQty(qty + 1)}
                disabled={(maxQty !== null && qty >= maxQty) || status === "loading"}
                aria-label={t("increaseQuantity")}
                className="flex h-10 w-9 items-center justify-center text-primary disabled:opacity-40"
              >
                +
              </button>
            </div>
            <div className="flex items-center gap-2">
              <WatchlistButton
                variant="icon"
                sku={product.sku}
                name={product.name}
                imageUrl={watchlistImageUrl}
              />
          <button
            type="button"
            onClick={handleAdd}
            disabled={status === "loading"}
            aria-label={t("addToCart")}
            className={`flex items-center justify-center w-11 h-11 shrink-0 rounded-(--radius-btn) text-white transition-all disabled:cursor-not-allowed ${
              status === "success"
                ? "bg-green-600"
                : status === "error"
                  ? "bg-red-600"
                  : "bg-secondary hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
            }`}
          >
            {status === "loading" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : status === "success" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : status === "error" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            )}
          </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {stock.level === "out" ? (
              <span className="inline-flex items-center justify-center rounded-full bg-red-600/10 px-2.5 py-1 text-xs font-medium text-red-700">
                {t("outOfStock")}
              </span>
            ) : null}
            <WatchlistButton
              variant="full"
              sku={product.sku}
              name={product.name}
              imageUrl={watchlistImageUrl}
            />
          </div>
        )}
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
