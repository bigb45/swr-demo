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
  type CustomOptionSelectionState,
} from "@/lib/custom-options";
import { resolveOptionsRequestSku } from "@/lib/copilot-stream";
import { notify } from "@/lib/toast";
import type { MagentoProductOption } from "@/types/magento";
import type { CopilotOptionsRequest } from "./types";

type AddStatus = "idle" | "loading" | "success" | "error";

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
        customOptions.length > 0 ? { customOptions } : undefined,
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

function CopilotOptionsPickerNoSku({
  request,
  disabled,
}: {
  request: CopilotOptionsRequest;
  disabled: boolean;
}) {
  const t = useTranslations("copilot");
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="mt-2 rounded-card bg-surface-container-lowest p-3 shadow-(--shadow-ambient)"
      aria-disabled={disabled}
    >
      <div className="mb-2 flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
          {t("optionsConfigureLabel")}
        </span>
        {request.productName ? (
          <span className="text-sm font-semibold leading-snug text-on-surface">
            {request.productName}
          </span>
        ) : null}
      </div>
      <p className="text-xs text-error">{t("optionsSkuMissing")}</p>
    </motion.div>
  );
}

export default function CopilotOptionsPicker({
  request,
  disabled,
  widgetSkus,
}: {
  request: CopilotOptionsRequest;
  disabled: boolean;
  /** Same-turn product cards; used to recover SKU when Teia omitted it. */
  widgetSkus?: string[];
}) {
  const resolved = resolveOptionsRequestSku(request, widgetSkus);

  if (resolved.sku) {
    return (
      <CopilotOptionsPickerDirect
        request={{ ...resolved, sku: resolved.sku }}
        disabled={disabled}
      />
    );
  }

  return <CopilotOptionsPickerNoSku request={resolved} disabled={disabled} />;
}
