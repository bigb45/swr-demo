/**
 * Pure helpers and env-derived constants safe for **client** bundles.
 * Server-only Magento REST code lives in `magento.ts` (uses `next/cache`).
 */
import type {
  MagentoCategory,
  MagentoPimFeature,
  MagentoProduct,
  MagentoUnifiedCatalogData,
  TeiaPimImage,
} from "@/types/magento";

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

/** URL params owned by the `/products` listing — not treated as attribute facets. */
export const PRODUCT_LIST_RESERVED_PARAMS = new Set([
  "page",
  "q",
  "category",
  "priceMin",
  "priceMax",
  "view",
]);

/** Parse a JSON string; pass plain objects through. Never throws. */
function safeJsonParse<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw !== "string") return raw as T;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

/**
 * Resolve a list that Magento may double-encode: the container can be a JSON
 * string, and each element can itself be a JSON string. Bad elements are
 * dropped rather than failing the whole list.
 */
function parseJsonArray<T>(raw: unknown): T[] {
  const container = safeJsonParse<unknown>(raw);
  if (!Array.isArray(container)) return [];
  const out: T[] = [];
  for (const entry of container) {
    const parsed = safeJsonParse<T>(entry);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      out.push(parsed);
    }
  }
  return out;
}

/** The enventa unified-catalog payload, from either carrier, or null. */
export function getUnifiedCatalogData(
  product: MagentoProduct,
): MagentoUnifiedCatalogData | null {
  const fromExt = safeJsonParse<MagentoUnifiedCatalogData>(
    product.extension_attributes?.unified_catalog_data,
  );
  if (fromExt && typeof fromExt === "object" && !Array.isArray(fromExt)) {
    return fromExt;
  }

  const attrRaw = product.custom_attributes?.find(
    (a) => a.attribute_code === "unified_catalog_data",
  )?.value;
  const fromAttr = safeJsonParse<MagentoUnifiedCatalogData>(attrRaw);
  if (fromAttr && typeof fromAttr === "object" && !Array.isArray(fromAttr)) {
    return fromAttr;
  }
  return null;
}

/** One display-ready PIM feature row. */
export interface PimFeature {
  code: string;
  label: string;
  values: string[];
  position: number;
}

function normalizeFeatures(raw: unknown): PimFeature[] {
  const entries = parseJsonArray<MagentoPimFeature>(raw);
  const out: PimFeature[] = [];

  entries.forEach((entry, index) => {
    const code = typeof entry.code === "string" ? entry.code.trim() : "";
    if (!code) return;

    const rawValues = Array.isArray(entry.values)
      ? entry.values
      : typeof entry.values === "string"
        ? (safeJsonParse<unknown>(entry.values) ?? entry.values)
        : [];
    const list = Array.isArray(rawValues) ? rawValues : [rawValues];

    const values = list
      .map((v) => (typeof v === "string" ? v.trim() : String(v ?? "").trim()))
      .filter((v) => v.length > 0);
    if (values.length === 0) return;

    const label =
      (typeof entry.label === "string" && entry.label.trim()) ||
      (typeof entry.name === "string" && entry.name.trim()) ||
      code;

    out.push({
      code,
      label,
      values,
      // `pim.features` carries no position — fall back to payload order.
      position:
        typeof entry.position === "number" && Number.isFinite(entry.position)
          ? entry.position
          : index,
    });
  });

  return out
    .map((f, i) => ({ f, i }))
    .sort((a, b) => a.f.position - b.f.position || a.i - b.i)
    .map(({ f }) => f);
}

/**
 * Curated PIM features for the PDP "Product information" block.
 * Prefers `teia_pim_specs` (label + position) and falls back to
 * `pim.features` (name, unordered). Never reads `pim.attributes` — that is
 * the raw PIM dump, full of internal codes and empty values.
 */
export function getPimFeatures(product: MagentoProduct): PimFeature[] {
  const fromExt = normalizeFeatures(
    product.extension_attributes?.teia_pim_specs,
  );
  if (fromExt.length > 0) return fromExt;

  const attrRaw = product.custom_attributes?.find(
    (a) => a.attribute_code === "teia_pim_specs",
  )?.value;
  const fromAttr = normalizeFeatures(attrRaw);
  if (fromAttr.length > 0) return fromAttr;

  return normalizeFeatures(getUnifiedCatalogData(product)?.pim?.features);
}

export function getTeiaPimImages(product: MagentoProduct): TeiaPimImage[] {
  const raw = getCustomAttribute(product, "teia_pim_images");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is TeiaPimImage =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as TeiaPimImage).url === "string" &&
          typeof (entry as TeiaPimImage).type === "string" &&
          (entry as TeiaPimImage).type.startsWith("image/"),
      )
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  } catch {
    return [];
  }
}

function getTeiaPimImageUrl(image: TeiaPimImage): string {
  return image.normalized_url ?? image.url;
}

export function getProductImageUrl(product: MagentoProduct): string | null {
  const entry = product.media_gallery_entries?.find((e) =>
    e.types.includes("image")
  );
  if (entry) {
    return `${MEDIA_BASE}/media/catalog/product${entry.file}`;
  }

  const pimImages = getTeiaPimImages(product);
  if (pimImages.length === 0) return null;
  return getTeiaPimImageUrl(pimImages[0]);
}

/** All non-disabled gallery images, ordered by Magento `position`, for card carousels / PDP galleries. */
export function getProductGalleryUrls(product: MagentoProduct): string[] {
  const entries = product.media_gallery_entries?.filter(
    (e) => !e.disabled && e.file && e.media_type !== "external-video",
  );
  if (entries?.length) {
    const sorted = [...entries].sort((a, b) => a.position - b.position);
    const urls: string[] = [];
    const seen = new Set<string>();
    for (const e of sorted) {
      const url = `${MEDIA_BASE}/media/catalog/product${e.file}`;
      if (!seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    }
    if (urls.length > 0) return urls;
  }

  const pimImages = getTeiaPimImages(product);
  if (pimImages.length === 0) return [];

  const urls: string[] = [];
  const seen = new Set<string>();
  for (const image of pimImages) {
    const url = getTeiaPimImageUrl(image);
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
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
