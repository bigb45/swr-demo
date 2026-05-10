"use client";

import Image from "next/image";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { MagentoProduct } from "@/types/magento";
import { getProductImageUrl, getCustomAttribute } from "@/lib/magento-shared";
import { getStockStatus, type StockLevel } from "@/lib/stock";
import { useCurrency } from "./CurrencyProvider";
import { useCart } from "./CartProvider";
import { useCustomerSession } from "./CustomerSessionProvider";
import StockBadge from "./ui/StockBadge";

interface ProductCardProps {
  product: MagentoProduct;
}

type AddStatus = "idle" | "loading" | "success" | "error";

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = getProductImageUrl(product);
  const shortDescription = getCustomAttribute(product, "short_description");
  const { formatPrice } = useCurrency();
  const { isAuthenticated } = useCustomerSession();
  const { addItem } = useCart();
  const locale = useLocale();
  const t = useTranslations("products");
  const [status, setStatus] = useState<AddStatus>("idle");

  const stock = getStockStatus(product);
  const canAdd =
    isAuthenticated && product.price > 0 && stock.level !== "out";
  const showGuestPriceGate =
    !isAuthenticated && product.price > 0;
  const stockLabel = getStockLabel(stock.level, t);

  async function handleAdd() {
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

  const href = `/products/${encodeURIComponent(product.sku)}`;

  return (
    <div className="group relative flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-200">
      <Link
        href={href}
        className="flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-16 h-16 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 px-4 pt-4 gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              {product.sku}
            </p>
            {stock.level !== "unknown" && (
              <StockBadge level={stock.level} label={stockLabel} />
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {shortDescription ? (
            <div
              className="text-xs text-gray-500 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: shortDescription }}
            />
          ) : null}
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 p-4 pt-3 mt-auto">
        {showGuestPriceGate ? (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs text-gray-600 leading-snug">
              {t("pricesLoginRequired")}
            </span>
            <Link
              href="/account/login"
              className="text-xs font-bold text-secondary hover:underline"
            >
              {t("signInForPrices")}
            </Link>
          </div>
        ) : (
          <span className="text-lg font-bold text-gray-900">
            {product.price > 0
              ? formatPrice(product.price, locale)
              : t("priceOnRequest")}
          </span>
        )}
        {canAdd && (
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
