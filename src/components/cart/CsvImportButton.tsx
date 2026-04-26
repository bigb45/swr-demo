"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/components/CartProvider";

interface ParsedRow {
  lineNumber: number;
  sku: string;
  qty: number;
}

interface RowOutcome {
  lineNumber: number;
  sku: string;
  qty: number;
  ok: boolean;
  /** Present on parse/validation failures (before the POST). */
  parseError?: string;
  /** Present on Magento errors after the POST. */
  addError?: string;
}

/**
 * Minimal RFC-4180-ish CSV splitter. Handles quoted fields, escaped quotes,
 * and both `\n` / `\r\n` line endings. Good enough for the two-column
 * format we accept (SKU, qty) — not a general-purpose CSV library.
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out.map((f) => f.trim());
}

function isHeaderRow(cells: string[]): boolean {
  const a = cells[0]?.toLowerCase() ?? "";
  const b = cells[1]?.toLowerCase() ?? "";
  return (
    a === "sku" || a === "article" || a === "artikel" || b === "qty" || b === "quantity"
  );
}

export default function CsvImportButton({ className }: { className?: string }) {
  const t = useTranslations("cart.csvImport");
  const cart = useCart();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<RowOutcome[] | null>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  async function handleFile(file: File) {
    setResults(null);

    const text = await file.text();
    const rows: ParsedRow[] = [];
    const parseErrors: RowOutcome[] = [];

    const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
    lines.forEach((line, idx) => {
      const lineNumber = idx + 1;
      const cells = splitCsvLine(line);
      if (idx === 0 && isHeaderRow(cells)) return;

      const sku = cells[0] ?? "";
      const qtyRaw = cells[1] ?? "";
      const qty = Number.parseInt(qtyRaw, 10);

      if (!sku) {
        parseErrors.push({
          lineNumber,
          sku: sku || "(empty)",
          qty: 0,
          ok: false,
          parseError: t("errMissingSku"),
        });
        return;
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        parseErrors.push({
          lineNumber,
          sku,
          qty: 0,
          ok: false,
          parseError: t("errInvalidQty"),
        });
        return;
      }
      rows.push({ lineNumber, sku, qty });
    });

    if (rows.length === 0 && parseErrors.length === 0) {
      setResults([
        {
          lineNumber: 0,
          sku: "",
          qty: 0,
          ok: false,
          parseError: t("errEmpty"),
        },
      ]);
      return;
    }

    startTransition(async () => {
      const outcomes: RowOutcome[] = [...parseErrors];
      for (const r of rows) {
        try {
          await cart.addBySku(r.sku, r.qty);
          outcomes.push({ ...r, ok: true });
        } catch (e) {
          outcomes.push({
            ...r,
            ok: false,
            addError: e instanceof Error ? e.message : String(e),
          });
        }
      }
      outcomes.sort((a, b) => a.lineNumber - b.lineNumber);
      setResults(outcomes);
    });
  }

  const successCount = results?.filter((r) => r.ok).length ?? 0;
  const problemCount = results ? results.length - successCount : 0;

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={
          className ??
          "px-5 py-2 text-xs font-semibold uppercase tracking-wide border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors rounded-(--radius-btn) disabled:opacity-50 disabled:cursor-not-allowed"
        }
      >
        {isPending ? t("importing") : t("button")}
      </button>
      <p className="text-[11px] text-on-surface-variant/70">{t("hint")}</p>

      {results && (
        <div className="bg-surface-container-lowest rounded-card p-3 text-xs flex flex-col gap-2">
          <p className="font-semibold text-on-surface">
            {t("summary", { added: successCount, problems: problemCount })}
          </p>
          {problemCount > 0 && (
            <ul className="flex flex-col gap-1">
              {results
                .filter((r) => !r.ok)
                .map((r, i) => (
                  <li
                    key={`${r.lineNumber}-${i}`}
                    className="flex flex-wrap items-baseline gap-2 text-on-surface-variant"
                  >
                    <span className="font-mono text-[10px]">
                      {t("row", { n: r.lineNumber })}
                    </span>
                    <span className="font-mono">{r.sku}</span>
                    <span className="text-red-600 font-semibold">
                      {r.parseError ?? r.addError}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
