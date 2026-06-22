import { Link } from "@/i18n/navigation";
import type { ShopCategoryNavItem } from "@/lib/shop-categories";
import ShopCategoryIcon from "./ShopCategoryIcon";

interface ShopCategorySidebarProps {
  heading: string;
  categories: ShopCategoryNavItem[];
}

export default function ShopCategorySidebar({
  heading,
  categories,
}: ShopCategorySidebarProps) {
  return (
    <aside className="hidden lg:block bg-surface-container-low p-4" style={{ borderRadius: "var(--radius-card)" }}>
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant mb-3">
        {heading}
      </h2>
      <nav className="flex flex-col gap-1" aria-label={heading}>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-on-surface hover:bg-white hover:text-primary transition-colors"
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            <ShopCategoryIcon icon={category.icon} className="h-6 w-6 shrink-0" />
            {category.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
