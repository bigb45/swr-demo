"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/components/CurrencyProvider";
import type {
  MagentoProductOption,
  MagentoProductOptionValue,
} from "@/types/magento";
import {
  getSupportedOptions,
  isMultiSelectOption,
  type CustomOptionSelectionState,
} from "@/lib/custom-options";

interface ProductCustomOptionsProps {
  options: MagentoProductOption[];
  value: CustomOptionSelectionState;
  onChange: (optionId: string, next: string | string[]) => void;
  missingOptionIds?: Set<string>;
}

export default function ProductCustomOptions({
  options,
  value,
  onChange,
  missingOptionIds,
}: ProductCustomOptionsProps) {
  const t = useTranslations("products");
  const { formatPrice } = useCurrency();
  const locale = useLocale();

  const supported = getSupportedOptions(options);
  if (supported.length === 0) return null;

  function priceSuffix(optValue: MagentoProductOptionValue): string | null {
    if (!optValue.price) return null;
    if (optValue.price_type === "percent") return `+${optValue.price}%`;
    return `+ ${formatPrice(optValue.price, locale)}`;
  }

  return (
    <div className="flex flex-col gap-5">
      {supported.map((opt) => {
        const id = String(opt.option_id);
        const missing = missingOptionIds?.has(id);
        const current = value[id];
        const labelId = `opt-${id}-label`;

        return (
          <fieldset key={id} className="flex flex-col gap-2" aria-labelledby={labelId}>
            <legend
              id={labelId}
              className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface"
            >
              {opt.title}
              {opt.is_require ? (
                <span className="ml-1 text-red-600" aria-hidden="true">
                  *
                </span>
              ) : null}
            </legend>

            {opt.type === "field" ? (
              <input
                type="text"
                maxLength={opt.max_characters || undefined}
                value={typeof current === "string" ? current : ""}
                onChange={(e) => onChange(id, e.target.value)}
                placeholder={t("options.textPlaceholder")}
                className="w-full text-sm px-3 py-2 bg-surface-container-lowest border border-outline-variant/60 focus:border-primary focus:outline-none rounded-(--radius-input)"
              />
            ) : null}

            {opt.type === "area" ? (
              <textarea
                maxLength={opt.max_characters || undefined}
                rows={3}
                value={typeof current === "string" ? current : ""}
                onChange={(e) => onChange(id, e.target.value)}
                placeholder={t("options.textPlaceholder")}
                className="w-full text-sm px-3 py-2 bg-surface-container-lowest border border-outline-variant/60 focus:border-primary focus:outline-none rounded-(--radius-input) resize-y"
              />
            ) : null}

            {opt.type === "drop_down" ? (
              <select
                value={typeof current === "string" ? current : ""}
                onChange={(e) => onChange(id, e.target.value)}
                className="w-full text-sm px-3 py-2 bg-surface-container-lowest border border-outline-variant/60 focus:border-primary focus:outline-none rounded-(--radius-input)"
              >
                <option value="">{t("options.chooseOption")}</option>
                {(opt.values ?? [])
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((v) => {
                    const suffix = priceSuffix(v);
                    return (
                      <option key={v.option_type_id} value={String(v.option_type_id)}>
                        {v.title}
                        {suffix ? ` (${suffix})` : ""}
                      </option>
                    );
                  })}
              </select>
            ) : null}

            {opt.type === "radio" ? (
              <div className="flex flex-col gap-1.5">
                {(opt.values ?? [])
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((v) => {
                    const checked = current === String(v.option_type_id);
                    const suffix = priceSuffix(v);
                    return (
                      <label
                        key={v.option_type_id}
                        className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded-(--radius-input) transition-colors ${
                          checked ? "bg-primary/10" : "hover:bg-surface-container-low"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`opt-${id}`}
                          checked={checked}
                          onChange={() => onChange(id, String(v.option_type_id))}
                          className="w-3.5 h-3.5 shrink-0 accent-primary"
                        />
                        <span className="flex-1 text-sm text-on-surface">{v.title}</span>
                        {suffix ? (
                          <span className="text-xs font-semibold text-secondary">
                            {suffix}
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
              </div>
            ) : null}

            {isMultiSelectOption(opt.type) ? (
              <div className="flex flex-col gap-1.5">
                {(opt.values ?? [])
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((v) => {
                    const selected = Array.isArray(current) ? current : [];
                    const valueId = String(v.option_type_id);
                    const checked = selected.includes(valueId);
                    const suffix = priceSuffix(v);
                    return (
                      <label
                        key={v.option_type_id}
                        className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded-(--radius-input) transition-colors ${
                          checked ? "bg-primary/10" : "hover:bg-surface-container-low"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? selected.filter((s) => s !== valueId)
                              : [...selected, valueId];
                            onChange(id, next);
                          }}
                          className="w-3.5 h-3.5 shrink-0 accent-primary"
                        />
                        <span className="flex-1 text-sm text-on-surface">{v.title}</span>
                        {suffix ? (
                          <span className="text-xs font-semibold text-secondary">
                            {suffix}
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
              </div>
            ) : null}

            {missing ? (
              <p className="text-xs text-red-600 font-medium">
                {t("options.requiredError")}
              </p>
            ) : null}
          </fieldset>
        );
      })}
    </div>
  );
}
