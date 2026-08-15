/**
 * Server-only Magento REST helpers for configurable products.
 * Builds the option/variant matrix the PDP VariantPicker consumes.
 *
 * Client components must import types/helpers from
 * `@/lib/configurable-shared` — this module pulls in `next/cache` via magento.
 */

import { magentoGet } from "@/lib/magento";
import {
  getCustomAttribute,
  getPimFeatures,
  getProductGalleryUrls,
  getUnifiedCatalogData,
  type PimFeature,
} from "@/lib/magento-shared";
import {
  type ConfigurableData,
  type ConfigurableOption,
  type ConfigurableOptionValue,
  type ConfigurableVariant,
} from "@/lib/configurable-shared";
import type {
  MagentoPimImage,
  MagentoProduct,
  MagentoProductAttribute,
  MagentoProductAttributeList,
} from "@/types/magento";

export type {
  ConfigurableData,
  ConfigurableOption,
  ConfigurableOptionValue,
  ConfigurableVariant,
} from "@/lib/configurable-shared";

export { findVariant, findVariantSku } from "@/lib/configurable-shared";

function extractPimSlice(product: MagentoProduct): {
  descriptionHtml: string | null;
  isDiscontinued: boolean;
  pimFeatures: PimFeature[];
  pimImageUrls: string[];
} {
  const pim = getUnifiedCatalogData(product)?.pim ?? null;
  const images = Array.isArray(pim?.images)
    ? (pim.images as MagentoPimImage[])
    : [];

  const pimImageUrls = images
    .map((img) => {
      const url =
        (typeof img?.url === "string" && img.url.trim()) ||
        (typeof img?.normalized_url === "string" && img.normalized_url.trim()) ||
        (typeof img?.thumbnail_url === "string" && img.thumbnail_url.trim()) ||
        "";
      return { url, position: typeof img?.position === "number" ? img.position : 0 };
    })
    .filter((img) => img.url.length > 0)
    .sort((a, b) => a.position - b.position)
    .map((img) => img.url);

  return {
    descriptionHtml:
      (typeof pim?.description === "string" && pim.description.trim()) ||
      getCustomAttribute(product, "description") ||
      null,
    isDiscontinued: Boolean(pim?.is_discontinued),
    pimFeatures: getPimFeatures(product),
    pimImageUrls,
  };
}

async function fetchAttributeMeta(
  attributeIds: string[],
): Promise<Map<string, MagentoProductAttribute>> {
  const out = new Map<string, MagentoProductAttribute>();
  const unique = Array.from(
    new Set(attributeIds.map((id) => id.trim()).filter(Boolean)),
  );
  if (unique.length === 0) return out;

  const params = new URLSearchParams();
  params.set("searchCriteria[filterGroups][0][filters][0][field]", "attribute_id");
  params.set(
    "searchCriteria[filterGroups][0][filters][0][condition_type]",
    "in",
  );
  params.set(
    "searchCriteria[filterGroups][0][filters][0][value]",
    unique.join(","),
  );
  params.set("searchCriteria[pageSize]", String(Math.max(unique.length, 20)));

  try {
    const list = await magentoGet<MagentoProductAttributeList>(
      `/products/attributes?${params.toString()}`,
      3600,
    );
    for (const item of list.items ?? []) {
      out.set(String(item.attribute_id), item);
    }
  } catch {
    // Labels fall back to option.label / value_index string below.
  }
  return out;
}

/**
 * Load configurable options + enabled children for a parent product.
 * Returns null when the product is not configurable or has no options.
 */
export async function getConfigurableData(
  parent: MagentoProduct,
): Promise<ConfigurableData | null> {
  if (parent.type_id !== "configurable") return null;

  const rawOptions =
    parent.extension_attributes?.configurable_product_options ?? [];
  if (rawOptions.length === 0) return null;

  const [children, attrMeta] = await Promise.all([
    magentoGet<MagentoProduct[]>(
      `/configurable-products/${encodeURIComponent(parent.sku)}/children`,
      false,
    ).catch(() => [] as MagentoProduct[]),
    fetchAttributeMeta(rawOptions.map((o) => String(o.attribute_id))),
  ]);

  const codeByAttributeId = new Map<string, string>();
  for (const [id, meta] of attrMeta) {
    if (meta.attribute_code) codeByAttributeId.set(id, meta.attribute_code);
  }

  const variants: ConfigurableVariant[] = [];
  const usedValues = new Map<string, Set<number>>();

  for (const child of children) {
    if (!child?.sku) continue;
    if (child.status != null && child.status !== 1) continue;

    const attributes: Record<string, number> = {};
    for (const opt of rawOptions) {
      const attrId = String(opt.attribute_id);
      const code =
        codeByAttributeId.get(attrId) ?? `attr_${attrId}`;
      if (!codeByAttributeId.has(attrId)) {
        codeByAttributeId.set(attrId, code);
      }

      const raw = getCustomAttribute(child, code);
      const valueIndex =
        raw != null && raw !== ""
          ? Number(raw)
          : NaN;
      if (!Number.isFinite(valueIndex)) continue;
      attributes[code] = valueIndex;

      let set = usedValues.get(code);
      if (!set) {
        set = new Set();
        usedValues.set(code, set);
      }
      set.add(valueIndex);
    }

    if (Object.keys(attributes).length === 0) continue;

    const pim = extractPimSlice(child);
    const magentoGallery = getProductGalleryUrls(child);
    const galleryUrls =
      pim.pimImageUrls.length > 0 ? pim.pimImageUrls : magentoGallery;

    variants.push({
      sku: child.sku,
      name: child.name,
      status: child.status,
      attributes,
      galleryUrls,
      descriptionHtml: pim.descriptionHtml,
      shortDescriptionHtml: getCustomAttribute(child, "short_description"),
      isDiscontinued: pim.isDiscontinued,
      pimFeatures: pim.pimFeatures,
    });
  }

  const options: ConfigurableOption[] = [...rawOptions]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((opt) => {
      const attrId = String(opt.attribute_id);
      const meta = attrMeta.get(attrId);
      const attributeCode =
        codeByAttributeId.get(attrId) ?? `attr_${attrId}`;
      const labelMap = new Map<string, string>();
      for (const o of meta?.options ?? []) {
        if (o.value != null && o.value !== "") {
          labelMap.set(String(o.value), o.label);
        }
      }

      const used = usedValues.get(attributeCode) ?? new Set<number>();
      const values: ConfigurableOptionValue[] = (opt.values ?? [])
        .map((v) => v.value_index)
        .filter((vi) => used.has(vi))
        .map((valueIndex) => ({
          valueIndex,
          label:
            labelMap.get(String(valueIndex)) ??
            String(valueIndex),
        }));

      if (meta?.options?.length) {
        const order = new Map(
          meta.options.map((o, i) => [String(o.value), i]),
        );
        values.sort(
          (a, b) =>
            (order.get(String(a.valueIndex)) ?? 999) -
            (order.get(String(b.valueIndex)) ?? 999),
        );
      }

      return {
        id: opt.id,
        attributeId: attrId,
        attributeCode,
        label:
          meta?.default_frontend_label?.trim() ||
          opt.label ||
          attributeCode,
        position: opt.position ?? 0,
        values,
      };
    })
    .filter((o) => o.values.length > 0);

  if (options.length === 0 || variants.length === 0) return null;

  return { options, variants };
}
