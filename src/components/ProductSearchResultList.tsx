"use client";

import { useTranslations } from "next-intl";
import type { MagentoProduct } from "@/types/magento";
import ProductSearchResultRow from "@/components/ProductSearchResultRow";

interface ProductSearchResultListProps {
  products: MagentoProduct[];
}

export default function ProductSearchResultList({
  products,
}: ProductSearchResultListProps) {
  const t = useTranslations("search");

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg
          className="w-12 h-12 text-outline-variant/50 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <p className="text-on-surface-variant text-sm">{t("empty")}</p>
      </div>
    );
  }

  return (
    <section
      aria-label={t("resultsListLandmark")}
      className="flex flex-col gap-4"
    >
      {products.map((product) => (
        <ProductSearchResultRow
          key={product.id ?? product.sku}
          product={product}
        />
      ))}
    </section>
  );
}
