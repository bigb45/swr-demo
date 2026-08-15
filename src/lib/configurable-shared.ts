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
