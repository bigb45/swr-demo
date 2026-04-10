"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { MagentoProduct } from "@/types/magento";
import { getProductImageUrl, getCustomAttribute } from "@/lib/magento";
import { useCurrency } from "./CurrencyProvider";

interface ProductCardProps {
  product: MagentoProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = getProductImageUrl(product);
  const shortDescription = getCustomAttribute(product, "short_description");
  const { formatPrice } = useCurrency();
  const locale = useLocale();
  const t = useTranslations("products");

  return (
    <Link
      href={`/products/${encodeURIComponent(product.sku)}`}
      className="group flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200"
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

      <div className="flex flex-col flex-1 p-4 gap-2">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
          {product.sku}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        {shortDescription && (
          <p
            className="text-xs text-gray-500 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: shortDescription }}
          />
        )}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            {product.price > 0
              ? formatPrice(product.price, locale)
              : t("priceOnRequest")}
          </span>
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
            {t("view")}
          </span>
        </div>
      </div>
    </Link>
  );
}
