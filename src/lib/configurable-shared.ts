/**
 * Client-safe configurable product types and selection helpers.
 * No Node / next/cache / Magento admin imports — safe for `"use client"`.
 */

/** One selectable value on a configurable attribute. */
export interface ConfigurableOptionValue {
  valueIndex: number;
  label: string;
}

/** One configurable attribute (e.g. Spannbereich). */
export interface ConfigurableOption {
  /** Magento option row id (used in cart as option_id for some payloads). */
  id: number;
  /** EAV attribute id — posted as configurable_item_options.option_id. */
  attributeId: string;
  attributeCode: string;
  label: string;
  position: number;
  values: ConfigurableOptionValue[];
}

import type { PimFeature } from "@/lib/magento-shared";

/** One child simple mapped to attribute_code → value_index. */
export interface ConfigurableVariant {
  sku: string;
  name: string;
  status: number;
  attributes: Record<string, number>;
  galleryUrls: string[];
  descriptionHtml: string | null;
  shortDescriptionHtml: string | null;
  isDiscontinued: boolean;
  pimFeatures: PimFeature[];
}

export interface ConfigurableData {
  options: ConfigurableOption[];
  variants: ConfigurableVariant[];
}

/**
 * Find the child SKU matching a complete attribute_code → value_index selection.
 */
export function findVariantSku(
  variants: ConfigurableVariant[],
  selection: Record<string, number>,
): string | null {
  const codes = Object.keys(selection);
  if (codes.length === 0) return null;
  const match = variants.find((v) =>
    codes.every((code) => v.attributes[code] === selection[code]),
  );
  return match?.sku ?? null;
}

export function findVariant(
  variants: ConfigurableVariant[],
  selection: Record<string, number>,
): ConfigurableVariant | null {
  const sku = findVariantSku(variants, selection);
  if (!sku) return null;
  return variants.find((v) => v.sku === sku) ?? null;
}

/**
 * True when attributes are perfectly correlated: every multi-value option
 * has exactly as many values as there are variants, so each value identifies
 * one variant. In that case the UI can collapse to a single dropdown.
 */
export function shouldCollapseOptions(
  options: ConfigurableOption[],
  variants: ConfigurableVariant[],
): boolean {
  if (options.length < 2 || variants.length < 2) return false;
  const choiceOptions = options.filter((o) => o.values.length > 1);
  if (choiceOptions.length < 2) return false;
  return choiceOptions.every((o) => o.values.length === variants.length);
}

/** One row in a collapsed combined-variant dropdown. */
export interface CombinedVariantChoice {
  sku: string;
  label: string;
  selection: Record<string, number>;
}

/**
 * Build dropdown rows for collapsed mode: each variant becomes one choice
 * labelled with all option/value pairs (e.g. "Height 1 · Width 3").
 */
export function buildCombinedChoices(
  options: ConfigurableOption[],
  variants: ConfigurableVariant[],
): CombinedVariantChoice[] {
  const firstChoice = options.find((o) => o.values.length > 1);
  const sortOrder = new Map<number, number>();
  if (firstChoice) {
    firstChoice.values.forEach((v, i) => {
      sortOrder.set(v.valueIndex, i);
    });
  }

  const choices: CombinedVariantChoice[] = [];
  for (const v of variants) {
    const selection = { ...v.attributes };
    if (findVariantSku(variants, selection) !== v.sku) continue;

    const label = options
      .map((o) => {
        const value = o.values.find(
          (x) => x.valueIndex === v.attributes[o.attributeCode],
        );
        return value ? `${o.label} ${value.label}` : null;
      })
      .filter((part): part is string => part != null)
      .join(" · ");

    if (!label) continue;
    choices.push({ sku: v.sku, label, selection });
  }

  if (firstChoice) {
    choices.sort((a, b) => {
      const aIdx =
        sortOrder.get(a.selection[firstChoice.attributeCode]!) ?? 999;
      const bIdx =
        sortOrder.get(b.selection[firstChoice.attributeCode]!) ?? 999;
      return aIdx - bIdx;
    });
  }

  return choices;
}
