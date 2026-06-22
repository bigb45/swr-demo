/**
 * Magento product Customizable Options (a.k.a. custom options) helpers shared by
 * the PDP add-to-cart UI, the cart API route, and the order detail page.
 *
 * Scope: text (`field`, `area`) and select (`drop_down`, `radio`, `checkbox`,
 * `multiple`) types. `file`/`date*` are intentionally unsupported and filtered
 * out so a product carrying them still renders and adds cleanly.
 */

import type {
  MagentoCustomOptionSelection,
  MagentoProductOption,
} from "@/types/magento";

/** Option types the storefront renders + can add to cart. */
export const SUPPORTED_OPTION_TYPES = new Set([
  "field",
  "area",
  "drop_down",
  "radio",
  "checkbox",
  "multiple",
]);

/** Select-type options carry `values[]` and allow one-or-more picks. */
export function isSelectOption(type: string): boolean {
  return (
    type === "drop_down" ||
    type === "radio" ||
    type === "checkbox" ||
    type === "multiple"
  );
}

/** Checkbox + multiselect accept multiple values; drop_down/radio are single. */
export function isMultiSelectOption(type: string): boolean {
  return type === "checkbox" || type === "multiple";
}

export function isTextOption(type: string): boolean {
  return type === "field" || type === "area";
}

/** Only the options the UI can handle, sorted by Magento sort order. */
export function getSupportedOptions(
  options: MagentoProductOption[] | undefined,
): MagentoProductOption[] {
  return (options ?? [])
    .filter((o) => SUPPORTED_OPTION_TYPES.has(o.type))
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** Local selection state keyed by option_id: text -> string, select -> id(s). */
export type CustomOptionSelectionState = Record<string, string | string[]>;

/** True when every required, supported option has a non-empty selection. */
export function getMissingRequiredOptions(
  options: MagentoProductOption[] | undefined,
  selection: CustomOptionSelectionState,
): MagentoProductOption[] {
  return getSupportedOptions(options).filter((opt) => {
    if (!opt.is_require) return false;
    const value = selection[String(opt.option_id)];
    if (Array.isArray(value)) return value.length === 0;
    return !value || value.trim().length === 0;
  });
}

/**
 * Convert local selection state into the Magento `custom_options` payload.
 * Skips empty optional entries.
 */
export function buildCustomOptionsPayload(
  options: MagentoProductOption[] | undefined,
  selection: CustomOptionSelectionState,
): MagentoCustomOptionSelection[] {
  const payload: MagentoCustomOptionSelection[] = [];
  for (const opt of getSupportedOptions(options)) {
    const raw = selection[String(opt.option_id)];
    if (Array.isArray(raw)) {
      if (raw.length === 0) continue;
      payload.push({
        option_id: String(opt.option_id),
        option_value: raw.join(","),
      });
    } else {
      const text = (raw ?? "").trim();
      if (!text) continue;
      payload.push({ option_id: String(opt.option_id), option_value: text });
    }
  }
  return payload;
}

/**
 * Resolve a Magento cart/order line's raw `custom_options`
 * (`{ option_id, option_value }`) into human-readable `{ label, value }` pairs
 * using the product's option definitions. Falls back to raw ids when a
 * definition is missing.
 */
export function resolveSelectedOptionLabels(
  customOptions: MagentoCustomOptionSelection[] | undefined,
  productOptions: MagentoProductOption[] | undefined,
): { label: string; value: string }[] {
  if (!customOptions?.length) return [];
  const byId = new Map(
    (productOptions ?? []).map((o) => [String(o.option_id), o]),
  );

  return customOptions.map((sel) => {
    const def = byId.get(String(sel.option_id));
    if (!def) {
      return { label: String(sel.option_id), value: String(sel.option_value) };
    }
    if (isSelectOption(def.type)) {
      const ids = String(sel.option_value)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const labels = ids.map((id) => {
        const match = def.values?.find(
          (v) => String(v.option_type_id) === id,
        );
        return match?.title ?? id;
      });
      return { label: def.title, value: labels.join(", ") };
    }
    return { label: def.title, value: String(sel.option_value) };
  });
}
