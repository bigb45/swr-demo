import { Link } from "@/i18n/navigation";
import type { ShopCategoryNavItem } from "@/lib/shop-categories";
import ShopCategoryIcon from "./ShopCategoryIcon";

interface ShopCategoryGridProps {
  categories: ShopCategoryNavItem[];
  emptyLabel: string;
  allProductsHref?: string;
  allProductsLabel?: string;
}

export default function ShopCategoryGrid({
  categories,
  emptyLabel,
  allProductsHref,
  allProductsLabel,
}: ShopCategoryGridProps) {
  const showAllProductsCard = Boolean(allProductsHref && allProductsLabel);

  if (categories.length === 0 && !showAllProductsCard) {
    return (
      <div className="bg-surface-container-lowest p-8 text-sm text-on-surface-variant" style={{ borderRadius: "var(--radius-card)" }}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={category.href}
          className="group bg-surface-container-lowest p-5 min-h-[132px] flex flex-col justify-between transition-colors hover:bg-surface-container-low"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <span className="inline-flex h-12 w-12 items-center justify-center bg-white p-1.5" style={{ borderRadius: "var(--radius-btn)" }}>
            <ShopCategoryIcon icon={category.icon} className="h-9 w-9" />
          </span>
          <span className="mt-6 flex items-center justify-between gap-4">
            <span className="text-base font-black uppercase tracking-[-0.01em] text-primary">
              {category.name}
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary transition-transform group-hover:translate-x-1" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </Link>
      ))}

      {showAllProductsCard ? (
        <Link
          href={allProductsHref!}
          className="group bg-surface-container-low p-5 min-h-[132px] flex flex-col justify-between transition-colors hover:bg-surface-container-highest"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <span className="inline-flex h-12 w-12 items-center justify-center bg-white p-1.5 text-secondary" style={{ borderRadius: "var(--radius-btn)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </span>
          <span className="mt-6 flex items-center justify-between gap-4">
            <span className="text-base font-black uppercase tracking-[-0.01em] text-primary">
              {allProductsLabel}
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary transition-transform group-hover:translate-x-1" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </Link>
      ) : null}
    </div>
  );
}
