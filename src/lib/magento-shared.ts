/**
 * Pure helpers and env-derived constants safe for **client** bundles.
 * Server-only Magento REST code lives in `magento.ts` (uses `next/cache`).
 */
import type { MagentoCategory, MagentoProduct } from "@/types/magento";

const envBase = process.env.MAGENTO_URL ?? "http://localhost:8000";

// MAGENTO_MEDIA_BASE_URL controls the base for catalog product images.
// NEXT_PUBLIC_ prefix makes this available in client components too,
// preventing React hydration mismatches on images.
export const MEDIA_BASE =
  process.env.NEXT_PUBLIC_MAGENTO_MEDIA_BASE_URL ??
  process.env.MAGENTO_MEDIA_BASE_URL ??
  envBase + "/pub";

export const LOCALE_STORE_CODES: Record<string, string> = {
  de: "de",
  en: "en",
  fr: "fr",
};

export function getProductImageUrl(product: MagentoProduct): string | null {
  const entry = product.media_gallery_entries?.find((e) =>
    e.types.includes("image")
  );
  if (!entry) return null;
  return `${MEDIA_BASE}/media/catalog/product${entry.file}`;
}

export function getCustomAttribute(
  product: MagentoProduct,
  code: string
): string | null {
  const attr = product.custom_attributes?.find(
    (a) => a.attribute_code === code
  );
  if (!attr) return null;
  return Array.isArray(attr.value) ? attr.value.join(", ") : attr.value;
}

export function findCategoryByName(
  root: MagentoCategory,
  candidates: string[]
): MagentoCategory | null {
  const normalized = candidates.map((c) => c.toLowerCase().trim());
  const queue: MagentoCategory[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (normalized.includes((node.name ?? "").toLowerCase().trim())) {
      return node;
    }
    if (Array.isArray(node.children_data)) {
      queue.push(...node.children_data);
    }
  }
  return null;
}
