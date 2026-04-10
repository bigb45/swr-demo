import { Link } from "@/i18n/navigation";

export interface CategoryItem {
  id: number | string;
  name: string;
  href: string;
  icon?: React.ReactNode;
}

interface CategoryGridProps {
  categories: CategoryItem[];
  columns?: number;
}

/**
 * High-density category icon grid.
 * - 5px radius on tiles (card grouping element)
 * - Tonal layering: white tiles on surface-container-low background
 * - No borders — depth via background shift
 */
export default function CategoryGrid({
  categories,
  columns = 6,
}: CategoryGridProps) {
  const gridCols: Record<number, string> = {
    4: "grid-cols-2 sm:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-5",
    6: "grid-cols-3 sm:grid-cols-4 md:grid-cols-6",
  };

  return (
    <div
      className={`grid ${gridCols[columns] ?? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6"} bg-surface-container-low`}
      style={{ borderRadius: "var(--radius-card)" }}
    >
      {categories.map((cat, idx) => (
        <Link
          key={cat.id}
          href={cat.href}
          className="flex flex-col items-center justify-center gap-3 py-6 px-4 bg-surface-container-lowest hover:bg-primary-fixed transition-colors group"
          style={{
            borderRadius: idx === 0 ? "var(--radius-card) 0 0 0" : idx === columns - 1 ? "0 var(--radius-card) 0 0" : undefined,
          }}
        >
          <span className="text-primary opacity-70 group-hover:opacity-100 transition-opacity">
            {cat.icon ?? <DefaultCategoryIcon />}
          </span>
          <span className="text-xs font-medium text-on-surface-variant group-hover:text-primary transition-colors text-center uppercase tracking-[0.05em]">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  );
}

function DefaultCategoryIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
