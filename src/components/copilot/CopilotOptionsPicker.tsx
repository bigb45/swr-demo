"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { useCart } from "@/components/CartProvider";
import ProductCustomOptions from "@/components/ui/ProductCustomOptions";
import {
  buildCustomOptionsPayload,
  getMissingRequiredOptions,
  getSupportedOptions,
  isMultiSelectOption,
  isSelectOption,
  isTextOption,
  type CustomOptionSelectionState,
} from "@/lib/custom-options";
import { notify } from "@/lib/toast";
import type { MagentoProductOption } from "@/types/magento";
import type {
  CopilotOptionGroup,
  CopilotOptionsRequest,
} from "./types";

type SelectionState = Record<string, string | string[]>;
type AddStatus = "idle" | "loading" | "success" | "error";

function isGroupSatisfied(
  group: CopilotOptionGroup,
  value: string | string[] | undefined,
): boolean {
  if (!group.required) return true;
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

/** Resolve a group's current pick(s) into human-readable label text. */
function selectionLabel(
  group: CopilotOptionGroup,
  value: string | string[] | undefined,
): string {
  if (isTextOption(group.type)) {
    return typeof value === "string" ? value.trim() : "";
  }
  const ids = Array.isArray(value) ? value : value ? [value] : [];
  return ids
    .map((id) => group.values.find((v) => v.valueId === id)?.label ?? id)
    .filter(Boolean)
    .join(", ");
}

/** Fallback picker when the backend gate has no sku — submits NL to the bot. */
function CopilotOptionsPickerFallback({
  request,
  disabled,
  onSubmit,
}: {
  request: CopilotOptionsRequest;
  disabled: boolean;
  onSubmit: (text: string) => void;
}) {
  const t = useTranslations("copilot");
  const reduce = useReducedMotion();
  const [selection, setSelection] = useState<SelectionState>({});
  const [showError, setShowError] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setValue = (optionId: string, next: string | string[]) => {
    setSelection((prev) => ({ ...prev, [optionId]: next }));
  };

  const complete = request.options.every((g) =>
    isGroupSatisfied(g, selection[g.optionId]),
  );

  const handleSubmit = () => {
    if (submitted || disabled) return;
    if (!complete) {
      setShowError(true);
      return;
    }
    const parts = request.options
      .map((g) => {
        const label = selectionLabel(g, selection[g.optionId]);
        return label ? `${g.title}: ${label}` : "";
      })
      .filter(Boolean)
      .join("; ");

    const text = request.productName
      ? t("optionsSelectionMessage", {
          name: request.productName,
          selections: parts,
        })
      : t("optionsSelectionMessageNoName", { selections: parts });

    setSubmitted(true);
    onSubmit(text);
  };

  const locked = disabled || submitted;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="mt-2 rounded-card bg-surface-container-lowest p-3 shadow-(--shadow-ambient)"
    >
      <div className="mb-3 flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
          {t("optionsConfigureLabel")}
        </span>
        {request.productName ? (
          <span className="text-sm font-semibold leading-snug text-on-surface">
            {request.productName}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        {request.options.map((group) => {
          const current = selection[group.optionId];
          const invalid = showError && !isGroupSatisfied(group, current);
          const labelId = `copilot-opt-${group.optionId}`;

          return (
            <fieldset
              key={group.optionId}
              className="flex flex-col gap-1.5"
              aria-labelledby={labelId}
              disabled={locked}
            >
              <legend
                id={labelId}
                className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface"
              >
                {group.title}
                {group.required ? (
                  <span
                    className="ml-1 text-error"
                    aria-label={t("optionsRequiredMarkAria")}
                  >
                    *
                  </span>
                ) : null}
              </legend>

              {isTextOption(group.type) ? (
                <input
                  type="text"
                  value={typeof current === "string" ? current : ""}
                  onChange={(e) => setValue(group.optionId, e.target.value)}
                  disabled={locked}
                  className="w-full rounded-(--radius-input) border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none ring-1 ring-transparent transition-shadow focus:ring-primary disabled:opacity-50"
                />
              ) : group.type === "drop_down" ? (
                <select
                  value={typeof current === "string" ? current : ""}
                  onChange={(e) => setValue(group.optionId, e.target.value)}
                  disabled={locked}
                  className="w-full rounded-(--radius-input) border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none ring-1 ring-transparent transition-shadow focus:ring-primary disabled:opacity-50"
                >
                  <option value="">{t("optionsChoose")}</option>
                  {group.values.map((v) => (
                    <option key={v.valueId} value={v.valueId}>
                      {v.label}
                      {v.price ? ` (+ ${v.price})` : ""}
                    </option>
                  ))}
                </select>
              ) : isSelectOption(group.type) ? (
                <div className="flex flex-col gap-1">
                  {group.values.map((v) => {
                    const multi = isMultiSelectOption(group.type);
                    const selected = multi
                      ? Array.isArray(current) && current.includes(v.valueId)
                      : current === v.valueId;
                    return (
                      <label
                        key={v.valueId}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-(--radius-input) px-2.5 py-2 transition-colors ${
                          selected
                            ? "bg-primary/10"
                            : "hover:bg-surface-container-low"
                        } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        <input
                          type={multi ? "checkbox" : "radio"}
                          name={`copilot-opt-${group.optionId}`}
                          checked={selected}
                          disabled={locked}
                          onChange={() => {
                            if (multi) {
                              const arr = Array.isArray(current) ? current : [];
                              setValue(
                                group.optionId,
                                arr.includes(v.valueId)
                                  ? arr.filter((x) => x !== v.valueId)
                                  : [...arr, v.valueId],
                              );
                            } else {
                              setValue(group.optionId, v.valueId);
                            }
                          }}
                          className="h-3.5 w-3.5 shrink-0 accent-primary"
                        />
                        <span className="flex-1 text-sm text-on-surface">
                          {v.label}
                        </span>
                        {v.price ? (
                          <span className="text-xs font-semibold tabular-nums text-secondary">
                            + {v.price}
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              ) : null}

              {invalid ? (
                <p className="text-xs font-medium text-error">
                  {t("optionsRequiredError")}
                </p>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={locked}
          className="rounded-(--radius-btn) bg-secondary px-4 py-2 text-xs font-semibold text-on-secondary transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitted ? t("optionsSubmitting") : t("optionsSubmit")}
        </button>
      </div>
    </motion.div>
  );
}

/** Direct add path: fetch real Magento options and add client-side. */
function CopilotOptionsPickerDirect({
  request,
  disabled,
}: {
  request: CopilotOptionsRequest & { sku: string };
  disabled: boolean;
}) {
  const t = useTranslations("copilot");
  const reduce = useReducedMotion();
  const { addBySku } = useCart();
  const [options, setOptions] = useState<MagentoProductOption[] | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [optionSelection, setOptionSelection] =
    useState<CustomOptionSelectionState>({});
  const [missingOptionIds, setMissingOptionIds] = useState<Set<string>>(
    new Set(),
  );
  const [addStatus, setAddStatus] = useState<AddStatus>("idle");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/copilot/product?sku=${encodeURIComponent(request.sku)}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          if (!cancel) setLoadState("error");
          return;
        }
        const data = (await res.json()) as { options?: MagentoProductOption[] };
        if (!cancel) {
          setOptions(getSupportedOptions(data.options));
          setLoadState("ready");
        }
      } catch {
        if (!cancel) setLoadState("error");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [request.sku]);

  const handleOptionChange = useCallback(
    (optionId: string, next: string | string[]) => {
      setOptionSelection((prev) => ({ ...prev, [optionId]: next }));
      if (missingOptionIds.has(optionId)) {
        setMissingOptionIds((prev) => {
          const updated = new Set(prev);
          updated.delete(optionId);
          return updated;
        });
      }
    },
    [missingOptionIds],
  );

  const handleSubmit = async () => {
    if (submitted || disabled || addStatus === "loading" || !options) return;

    const missing = getMissingRequiredOptions(options, optionSelection);
    if (missing.length > 0) {
      setMissingOptionIds(
        new Set(missing.map((o) => String(o.option_id))),
      );
      return;
    }

    const customOptions = buildCustomOptionsPayload(options, optionSelection);

    setAddStatus("loading");
    try {
      await addBySku(
        request.sku,
        1,
        customOptions.length > 0 ? customOptions : undefined,
      );
      setAddStatus("success");
      setSubmitted(true);
      notify.success(t("addToCartSuccess"));
      window.setTimeout(() => setAddStatus("idle"), 1600);
    } catch {
      setAddStatus("error");
      notify.error(t("addToCartFailed"));
      window.setTimeout(() => setAddStatus("idle"), 2400);
    }
  };

  const locked = disabled || submitted || addStatus === "loading";

  const submitLabel =
    addStatus === "loading"
      ? t("optionsSubmitting")
      : addStatus === "success"
        ? t("addToCartSuccess")
        : addStatus === "error"
          ? t("addToCartFailed")
          : t("optionsSubmit");

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="mt-2 rounded-card bg-surface-container-lowest p-3 shadow-(--shadow-ambient)"
    >
      <div className="mb-3 flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
          {t("optionsConfigureLabel")}
        </span>
        {request.productName ? (
          <span className="text-sm font-semibold leading-snug text-on-surface">
            {request.productName}
          </span>
        ) : null}
        {request.message ? (
          <p className="text-xs text-on-surface-variant">{request.message}</p>
        ) : null}
      </div>

      {loadState === "loading" ? (
        <p className="text-xs text-on-surface-variant">{t("productLoading")}</p>
      ) : loadState === "error" || !options || options.length === 0 ? (
        <p className="text-xs text-error">
          {t("productNotFound", { sku: request.sku })}
        </p>
      ) : (
        <ProductCustomOptions
          options={options}
          value={optionSelection}
          onChange={handleOptionChange}
          missingOptionIds={missingOptionIds}
        />
      )}

      {loadState === "ready" && options && options.length > 0 ? (
        <div className="mt-3 flex items-center justify-end">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={locked}
            className={`rounded-(--radius-btn) px-4 py-2 text-xs font-semibold text-on-secondary transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${
              addStatus === "success"
                ? "bg-secondary"
                : addStatus === "error"
                  ? "bg-error"
                  : "bg-secondary"
            }`}
          >
            {submitLabel}
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}

export default function CopilotOptionsPicker({
  request,
  disabled,
  onSubmit,
}: {
  request: CopilotOptionsRequest;
  disabled: boolean;
  onSubmit: (text: string) => void;
}) {
  if (request.sku) {
    return (
      <CopilotOptionsPickerDirect request={{ ...request, sku: request.sku }} disabled={disabled} />
    );
  }

  return (
    <CopilotOptionsPickerFallback
      request={request}
      disabled={disabled}
      onSubmit={onSubmit}
    />
  );
}
