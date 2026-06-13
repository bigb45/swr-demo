import type { MagentoCategory } from "@/types/magento";

export type ShopCategoryIcon =
  | "welding"
  | "tools"
  | "machines"
  | "safety"
  | "facility"
  | "supplies"
  | "compressedAir"
  | "catalog"
  | "default";

export interface ShopCategoryNavItem {
  id: number;
  name: string;
  href: `/categories/${number}`;
  icon: ShopCategoryIcon;
}

/** Official SWR shop category icons — see scripts/download-shop-category-icons.sh */
export const SHOP_CATEGORY_ICON_SRC: Partial<Record<ShopCategoryIcon, string>> =
  {
    welding: "/shop/category-icons/schweisstechnik.png",
    tools: "/shop/category-icons/werkzeuge.png",
    machines: "/shop/category-icons/maschinen.png",
    safety: "/shop/category-icons/arbeitsschutz.png",
    facility: "/shop/category-icons/lager-betriebseinrichtung.png",
    supplies: "/shop/category-icons/werkstattbedarf.png",
    compressedAir: "/shop/category-icons/druckluft.png",
  };

function normalizeCategoryName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function inferCategoryIcon(name: string): ShopCategoryIcon {
  const n = normalizeCategoryName(name);
  if (n.includes("schweiss") || n.includes("weld")) return "welding";
  if (n.includes("schraub") || n.includes("werkzeug") || n.includes("tool"))
    return "tools";
  if (n.includes("maschine") || n.includes("machine")) return "machines";
  if (
    n.includes("arbeitsschutz") ||
    n.includes("schutz") ||
    n.includes("safety") ||
    n.includes("ppe")
  ) {
    return "safety";
  }
  if (
    n.includes("lager") ||
    n.includes("betrieb") ||
    n.includes("einrichtung") ||
    n.includes("facility")
  ) {
    return "facility";
  }
  if (n.includes("werkstatt") || n.includes("bedarf") || n.includes("suppl"))
    return "supplies";
  if (n.includes("druckluft") || n.includes("compressed air"))
    return "compressedAir";
  if (n.includes("katalog") || n.includes("catalog")) return "catalog";
  return "default";
}

export function toShopCategoryNavItems(
  categories: MagentoCategory[],
  limit?: number,
): ShopCategoryNavItem[] {
  const items = categories
    .filter((category) => category.is_active)
    .sort((a, b) => a.position - b.position)
    .map((category) => ({
      id: category.id,
      name: category.name,
      href: `/categories/${category.id}` as const,
      icon: inferCategoryIcon(category.name),
    }));

  return typeof limit === "number" ? items.slice(0, limit) : items;
}
