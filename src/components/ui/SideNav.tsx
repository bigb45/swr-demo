import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { MagentoCategory } from "@/types/magento";

/* Category icon SVGs — inline for zero-dependency approach */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  fasteners: (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1v18M5 5l4-4 4 4M5 15l4 4 4-4" />
    </svg>
  ),
  rawMaterials: (
    <svg width="18" height="19" viewBox="0 0 18 19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="16" height="17" rx="1" />
      <line x1="5" y1="6" x2="13" y2="6" />
      <line x1="5" y1="10" x2="13" y2="10" />
      <line x1="5" y1="14" x2="10" y2="14" />
    </svg>
  ),
  handTools: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 15L12 6M12 6l2-5 3 3-5 2zM6 12l-3 3" />
    </svg>
  ),
  powerTools: (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="8,1 15,10 10,10 10,19 1,10 6,10" />
    </svg>
  ),
  safety: (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1L1 5v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V5L9 1z" />
    </svg>
  ),
  abrasives: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="8" />
      <circle cx="9" cy="9" r="3" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="9" y1="14" x2="9" y2="17" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="14" y1="9" x2="17" y2="9" />
    </svg>
  ),
};

function getIconForCategory(name: string): React.ReactNode {
  const lower = name.toLowerCase();
  if (lower.includes("fastener") || lower.includes("schraub")) return CATEGORY_ICONS.fasteners;
  if (lower.includes("raw") || lower.includes("material") || lower.includes("rohstoff")) return CATEGORY_ICONS.rawMaterials;
  if (lower.includes("hand") || lower.includes("werkzeug")) return CATEGORY_ICONS.handTools;
  if (lower.includes("power") || lower.includes("elektro")) return CATEGORY_ICONS.powerTools;
  if (lower.includes("safe") || lower.includes("sicher")) return CATEGORY_ICONS.safety;
  if (lower.includes("abrasiv") || lower.includes("schleif")) return CATEGORY_ICONS.abrasives;
  return CATEGORY_ICONS.handTools;
}

interface SideNavProps {
  locale: string;
  categories: MagentoCategory[];
  activeCategoryId?: number;
  width?: "narrow" | "wide";
}

export default async function SideNav({
  locale,
  categories,
  activeCategoryId,
  width = "narrow",
}: SideNavProps) {
  const t = await getTranslations({ locale, namespace: "sidebar" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const widthClass = width === "wide" ? "w-64" : "w-[175px]";

  return (
    <aside
      className={`hidden lg:flex ${widthClass} shrink-0 bg-surface-container-low flex-col sticky top-[97px] h-[calc(100vh-97px)]`}
    >
      {/* Catalog heading */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h2 className="text-lg font-bold text-primary tracking-tight">
          {t("catalog")}
        </h2>
        <p className="text-xs text-on-surface-variant mt-1 uppercase tracking-[0.05em]">
          {t("technicalSpecs")}
        </p>
      </div>

      {/* Category nav — scrollable when list overflows */}
      <nav className="flex-1 overflow-y-auto min-h-0" aria-label={t("catalog")}>
        <ul>
          {categories.map((cat) => {
            const isActive = cat.id === activeCategoryId;
            return (
              <li key={cat.id}>
                <Link
                  href={`/categories/${cat.id}`}
                  className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-on-surface-variant hover:bg-surface-container-highest hover:text-primary"
                  }`}
                >
                  <span className="shrink-0 opacity-70">
                    {getIconForCategory(cat.name)}
                  </span>
                  <span>{cat.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom actions — always visible */}
      <div className="border-t border-[rgba(193,199,209,0.15)] shrink-0">
        <div className="px-6 py-6">
          <Link
            href="/bulk-order"
            className="block w-full text-center py-2 text-sm font-semibold text-primary border border-primary hover:bg-primary hover:text-white transition-colors"
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            {t("bulkOrderCsv")}
          </Link>
        </div>
        <ul className="px-6 pb-6 flex flex-col gap-3">
          <li>
            <Link
              href="/contact"
              className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.72 16z" />
              </svg>
              {t("contactSupport")}
            </Link>
          </li>
          <li>
            <Link
              href="/locations"
              className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              <svg width="9" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {t("locations")}
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
