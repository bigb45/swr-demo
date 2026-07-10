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

const GALLERY_NAV_CLASS =
  "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 group-focus-within/card:opacity-100 [@media(hover:none)]:opacity-100";

function GalleryNavButton({
  direction,
  label,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  onClick: (e: MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-(--radius-btn) border border-outline-variant/40 bg-surface-container-lowest/95 text-primary shadow-ambient transition-colors hover:bg-surface-container-low focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {direction === "prev" ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 18 15 12 9 6" />
        )}
      </svg>
    </button>
  );
}

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
    <div className="relative aspect-square overflow-hidden bg-surface-container-low">
      {displayUrl ? (
        <>
          <Image
            key={`${product.sku}-${imageIndex}`}
            src={displayUrl}
            alt={product.name}
            fill
            priority={priorityImage && imageIndex === 0}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-4 transition-transform duration-300 group-hover/card:scale-[1.03]"
          />
          {showGalleryNav ? (
            <>
              <div
                className={`${GALLERY_NAV_CLASS} flex items-center justify-between px-1.5`}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
              >
                <GalleryNavButton
                  direction="prev"
                  label={t("galleryPrevImage")}
                  onClick={goPrev}
                />
                <GalleryNavButton
                  direction="next"
                  label={t("galleryNextImage")}
                  onClick={goNext}
                />
              </div>
              <div
                className={`${GALLERY_NAV_CLASS} flex items-end justify-center pb-2`}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
              >
                <span className="pointer-events-none rounded-(--radius-btn) bg-on-surface/70 px-2 py-0.5 text-[10px] font-semibold tabular-nums tracking-wide text-white">
                  {t("galleryImageCount", {
                    current: imageIndex + 1,
                    total: galleryUrls.length,
                  })}
                </span>
              </div>
            </>
          ) : null}
        </>
      ) : (
        <NoImagePlaceholder variant="card" />
      )}
    </div>
  );
}

function AddToCartIcon({ status }: { status: AddStatus }) {
  if (status === "loading") {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-spin shrink-0"
        aria-hidden
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    );
  }
  if (status === "success") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (status === "error") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
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
    <article className="group/card relative flex flex-col overflow-hidden rounded-card border border-outline-variant/80 bg-surface-container-lowest transition-colors duration-200 hover:border-outline-variant">
      <Link
        href={href}
        className="flex min-h-0 flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <ProductCardGallery
          key={product.sku}
          product={product}
          priorityImage={priorityImage}
        />

        <div className="flex flex-1 flex-col gap-2 px-4 pb-2 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            {stock.level !== "unknown" ? (
              <StockBadge
                level={stock.level}
                label={stockLabel}
                variant="inline"
                size="sm"
                className="shrink-0"
              />
            ) : null}
            <p
              className="min-w-0 flex-1 truncate font-mono text-[11px] uppercase tracking-wider text-on-surface-variant/70"
              title={product.sku}
            >
              {product.sku}
            </p>
            {canAddToCart ? (
              <WatchlistButton
                variant="icon"
                size="sm"
                sku={product.sku}
                name={product.name}
                imageUrl={watchlistImageUrl}
                className="shrink-0 border-transparent bg-transparent opacity-0 shadow-none transition-opacity duration-200 group-hover/card:opacity-100 group-focus-within/card:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
              />
            ) : null}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-primary">
            {product.name}
          </h3>
          {shortDescription ? (
            <div
              className="line-clamp-2 text-xs text-on-surface-variant"
              dangerouslySetInnerHTML={{ __html: shortDescription }}
            />
          ) : null}
        </div>
      </Link>

      <div className="mt-auto border-t border-outline-variant/15 bg-surface-container-low px-4 py-3">
        <div className="mb-2.5 min-h-5.5">
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
            <span className="text-base font-bold tabular-nums text-primary">
              {product.price > 0
                ? formatPrice(product.price, locale)
                : t("priceOnRequest")}
            </span>
          )}
        </div>

        {canAddToCart ? (
          <div className="flex items-stretch gap-2">
            <div
              className="inline-flex h-9 min-w-0 shrink-0 items-center rounded-(--radius-btn) bg-surface-container-lowest"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => updateQty(qty - 1)}
                disabled={qty <= 1 || status === "loading"}
                aria-label={t("decreaseQuantity")}
                className="flex h-9 w-8 shrink-0 items-center justify-center text-sm font-semibold text-primary disabled:opacity-40"
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
                className="h-9 w-9 min-w-0 bg-transparent text-center text-xs font-bold tabular-nums text-on-surface outline-none"
              />
              <button
                type="button"
                onClick={() => updateQty(qty + 1)}
                disabled={(maxQty !== null && qty >= maxQty) || status === "loading"}
                aria-label={t("increaseQuantity")}
                className="flex h-9 w-8 shrink-0 items-center justify-center text-sm font-semibold text-primary disabled:opacity-40"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={status === "loading"}
              className={`inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-(--radius-btn) px-2 text-xs font-bold tracking-wide text-white transition-all disabled:cursor-not-allowed ${
                status === "success"
                  ? "bg-green-600"
                  : status === "error"
                    ? "bg-red-600"
                    : "bg-secondary hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
              }`}
            >
              <AddToCartIcon status={status} />
              <span className="truncate">{t("addToCart")}</span>
            </button>
          </div>
        ) : (
          <WatchlistButton
            variant="full"
            sku={product.sku}
            name={product.name}
            imageUrl={watchlistImageUrl}
          />
        )}
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
