"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type {
  ConfigurableOption,
  ConfigurableVariant,
} from "@/lib/configurable-shared";

export type VariantSelection = Record<string, number>;

interface VariantPickerProps {
  options: ConfigurableOption[];
  variants: ConfigurableVariant[];
  selection: VariantSelection;
  onChange: (next: VariantSelection) => void;
  /** True while a dependent price fetch is in flight. */
  busy?: boolean;
}

/**
 * True when at least one variant matches `partial` (all keys in partial).
 */
function hasCompatibleVariant(
  variants: ConfigurableVariant[],
  partial: VariantSelection,
): boolean {
  const codes = Object.keys(partial);
  if (codes.length === 0) return variants.length > 0;
  return variants.some((v) =>
    codes.every((code) => v.attributes[code] === partial[code]),
  );
}

export default function VariantPicker({
  options,
  variants,
  selection,
  onChange,
  busy = false,
}: VariantPickerProps) {
  const t = useTranslations("products");

  const disabledByOption = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const opt of options) {
      const disabled = new Set<number>();
      for (const value of opt.values) {
        const trial: VariantSelection = {
          ...selection,
          [opt.attributeCode]: value.valueIndex,
        };
        if (!hasCompatibleVariant(variants, trial)) {
          disabled.add(value.valueIndex);
        }
      }
      map.set(opt.attributeCode, disabled);
    }
    return map;
  }, [options, variants, selection]);

  function handleSelect(attributeCode: string, raw: string) {
    if (!raw) {
      const next = { ...selection };
      delete next[attributeCode];
      onChange(next);
      return;
    }
    const valueIndex = Number(raw);
    if (!Number.isFinite(valueIndex)) return;
    onChange({ ...selection, [attributeCode]: valueIndex });
  }

  return (
    <div className="flex flex-col gap-3" aria-busy={busy || undefined}>
      {options.map((opt) => {
        const selected = selection[opt.attributeCode];
        const disabled = disabledByOption.get(opt.attributeCode);
        const selectId = `variant-${opt.attributeCode}`;
        return (
          <div key={opt.attributeCode} className="flex flex-col gap-1.5">
            <label
              htmlFor={selectId}
              className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant"
            >
              {opt.label}
            </label>
            <select
              id={selectId}
              value={selected != null ? String(selected) : ""}
              onChange={(e) => handleSelect(opt.attributeCode, e.target.value)}
              className="h-10 w-full rounded-(--radius-btn) border border-outline-variant/40 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">{t("variantChoose", { label: opt.label })}</option>
              {opt.values.map((v) => (
                <option
                  key={v.valueIndex}
                  value={String(v.valueIndex)}
                  disabled={disabled?.has(v.valueIndex)}
                >
                  {v.label}
                  {disabled?.has(v.valueIndex)
                    ? ` (${t("variantUnavailable")})`
                    : ""}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
