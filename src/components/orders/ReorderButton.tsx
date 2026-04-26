"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";

interface ReorderLine {
  sku: string;
  name: string;
  qty: number;
  /**
   * Magento `product_type` ("simple", "configurable", "bundle", …). Anything
   * other than simple/virtual/downloadable is flagged as needing manual
   * re-add on PDP because the REST `POST cart items` call requires options.
   */
  productType?: string;
}

interface ReorderButtonProps {
  locale: string;
  items: ReorderLine[];
}

interface LineResult {
  sku: string;
  name: string;
  ok: boolean;
  /** Present when the line was skipped before the POST (non-simple product). */
  skipped?: boolean;
  error?: string;
}

const RE_ORDERABLE_TYPES = new Set(["simple", "virtual", "downloadable"]);

/**
 * Reorder button for the order detail page. Iterates the order lines and
 * POSTs each to the cart; collects per-row outcomes so the user can see
 * which SKUs succeeded vs. require manual attention (e.g. configurables).
 */
export default function ReorderButton({ locale, items }: ReorderButtonProps) {
  const t = useTranslations("orders");
  const cart = useCart();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<LineResult[] | null>(null);

  function handleClick() {
    setResults(null);

    startTransition(async () => {
      const rows: LineResult[] = [];
      for (const line of items) {
        if (line.productType && !RE_ORDERABLE_TYPES.has(line.productType)) {
          rows.push({
            sku: line.sku,
            name: line.name,
            ok: false,
            skipped: true,
          });
          continue;
        }
        try {
          await cart.addBySku(line.sku, line.qty);
          rows.push({ sku: line.sku, name: line.name, ok: true });
        } catch (e) {
          rows.push({
            sku: line.sku,
            name: line.name,
            ok: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
      setResults(rows);
    });
  }

  const successCount = results?.filter((r) => r.ok).length ?? 0;
  const problemCount = results ? results.length - successCount : 0;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending || items.length === 0}
        className="inline-flex items-center gap-2 px-4 py-3 bg-secondary text-white font-bold text-xs uppercase tracking-[0.12em] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ borderRadius: "var(--radius-btn)" }}
      >
        {isPending ? t("reordering") : t("reorder")}
      </button>

      {results && (
        <div className="bg-surface-container-lowest rounded-card p-4 text-xs flex flex-col gap-2">
          <p className="font-semibold text-on-surface">
            {t("reorderSummary", {
              added: successCount,
              problems: problemCount,
            })}
          </p>
          {problemCount > 0 && (
            <ul className="flex flex-col gap-1.5">
              {results
                .filter((r) => !r.ok)
                .map((r) => (
                  <li
                    key={r.sku}
                    className="flex flex-wrap items-baseline gap-2 text-on-surface-variant"
                  >
                    <span className="font-mono">{r.sku}</span>
                    <span className="flex-1 truncate">{r.name}</span>
                    <span className="text-red-600 font-semibold">
                      {r.skipped ? t("reorderNeedsOptions") : r.error}
                    </span>
                  </li>
                ))}
            </ul>
          )}
          {successCount > 0 && (
            <button
              type="button"
              onClick={() => router.push(`/${locale}/cart`)}
              className="self-start text-secondary font-semibold hover:underline mt-1"
            >
              {t("reorderGoToCart")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
