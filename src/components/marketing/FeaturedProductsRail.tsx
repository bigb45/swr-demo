import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import ProductCard from "@/components/ProductCard";
import type { MagentoProduct } from "@/types/magento";

interface FeaturedProductsRailProps {
  heading: string;
  subheading?: string;
  products: MagentoProduct[];
  viewAllHref?: string;
  viewAllLabel?: string;
  emptyLabel?: string;
}

export default function FeaturedProductsRail({
  heading,
  subheading,
  products,
  viewAllHref,
  viewAllLabel,
  emptyLabel,
}: FeaturedProductsRailProps) {
  if (products.length === 0) {
    if (!emptyLabel) return null;
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl sm:text-4xl font-black tracking-[-0.02em] text-primary leading-tight">
          {heading}
        </h2>
        {subheading ? (
          <p className="text-sm text-on-surface-variant max-w-2xl">
            {subheading}
          </p>
        ) : null}
        <p className="text-sm text-on-surface-variant">{emptyLabel}</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-[-0.02em] text-primary leading-tight">
            {heading}
          </h2>
          {subheading ? (
            <p className="mt-2 text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              {subheading}
            </p>
          ) : null}
        </div>
        {viewAllHref && viewAllLabel ? (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:underline whitespace-nowrap"
          >
            {viewAllLabel}
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.sku} product={product} />
        ))}
      </div>
    </section>
  );
}
