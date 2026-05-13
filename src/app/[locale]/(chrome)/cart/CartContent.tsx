"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/CartProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import StockBadge from "@/components/ui/StockBadge";
import CsvImportButton from "@/components/cart/CsvImportButton";
import type { StockLevel } from "@/lib/stock";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function CartContent() {
  const t = useTranslations("cart");
  const tProducts = useTranslations("products");
  const { items, totals, loading, fetchError, updateQty, removeItem, restoreItem } =
    useCart();
  const { formatAmount } = useCurrency();
  const [cartError, setCartError] = useState<string | null>(null);
  const [removedItem, setRemovedItem] = useState<(typeof items)[number] | null>(null);
  const [undoLoading, setUndoLoading] = useState(false);
  const undoTimeoutRef = useRef<number | null>(null);

  // Use Magento-calculated totals when available; fall back to client-side
  // estimates while the fetch is in flight (e.g. on first render).
  const subtotal =
    totals?.subtotal_with_discount ??
    items.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        window.clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  async function handleQtyCommit(itemId: number, sku: string, qty: number) {
    setCartError(null);
    try {
      await updateQty(itemId, sku, qty);
    } catch (err) {
      setCartError(err instanceof Error ? err.message : t("updateError"));
      throw err;
    }
  }

  async function handleRemove(item: (typeof items)[number]) {
    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current);
    }

    setRemovedItem(null);
    setCartError(null);
    setUndoLoading(false);
    try {
      await removeItem(item.itemId);
      setRemovedItem(item);

      undoTimeoutRef.current = window.setTimeout(() => {
        setRemovedItem(null);
        undoTimeoutRef.current = null;
      }, 6000);
    } catch (err) {
      setCartError(err instanceof Error ? err.message : t("updateError"));
    }
  }

  async function handleUndoRemove() {
    if (!removedItem) return;

    setUndoLoading(true);
    setCartError(null);
    try {
      await restoreItem(removedItem);
      setRemovedItem(null);
      if (undoTimeoutRef.current) {
        window.clearTimeout(undoTimeoutRef.current);
        undoTimeoutRef.current = null;
      }
    } catch (err) {
      setCartError(err instanceof Error ? err.message : t("updateError"));
    } finally {
      setUndoLoading(false);
    }
  }

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-stretch xl:items-start">
      {/* ── Left: Cart Items ──────────────────────────────────────── */}
      <section className="w-full flex-1 min-w-0">
        {/* Back link */}
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors mb-5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {t("continueProcurement")}
        </Link>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary leading-tight mb-2">
            {t("heading")}
          </h1>
          <p className="text-sm text-on-surface-variant">{t("subheading")}</p>
        </div>

        {cartError && (
          <div className="mb-6 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {cartError}
          </div>
        )}

        {fetchError && items.length === 0 && !loading && (
          <div
            role="alert"
            className="mb-6 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {t("fetchError")}
          </div>
        )}

        {removedItem && (
          <div className="mb-6 border-y border-outline-variant/40 bg-surface px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-on-surface">
                <span className="font-semibold text-primary">{removedItem.name}</span>{" "}
                {t("removedNotice")}
              </p>
              <button
                type="button"
                onClick={handleUndoRemove}
                disabled={undoLoading}
                className="self-start text-sm font-semibold text-secondary underline underline-offset-2 hover:text-primary disabled:opacity-50 disabled:no-underline"
              >
                {undoLoading ? t("undoing") : t("undo")}
              </button>
            </div>
          </div>
        )}

        {loading && items.length === 0 ? (
          <CartSkeleton label={t("loading")} />
        ) : items.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-6 text-center">
            {/* Cart illustration */}
            <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant/40">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-primary mb-1">{t("empty")}</p>
              <p className="text-sm text-on-surface-variant max-w-[280px]">{t("emptyHint")}</p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-white text-sm font-bold uppercase tracking-wide hover:brightness-110 transition-all rounded-(--radius-btn)"
            >
              {t("browseProducts")}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <div className="w-full max-w-sm pt-4 border-t border-outline-variant/30">
              <CsvImportButton />
            </div>
          </div>
        ) : (
          <>
            {/* Table header — desktop only */}
            <div
              className="hidden lg:grid text-xs font-semibold uppercase tracking-wide text-on-surface-variant bg-surface-container-low px-4 py-2"
              style={{ gridTemplateColumns: "1fr 126px 126px 126px" }}
            >
              <span>{t("colItem")}</span>
              <span className="text-center">{t("colUnitPrice")}</span>
              <span className="text-center">{t("colQuantity")}</span>
              <span className="text-right">{t("colTotal")}</span>
            </div>

            {/* Items */}
            <div className="divide-y divide-outline-variant/30">
              {items.map((item) => {
                const lineTotal = item.unitPrice * item.qty;
                return (
                  <div key={item.itemId} className="py-5 px-4">
                    {/* Desktop: 4-column grid */}
                    <div
                      className="hidden lg:grid items-center gap-4"
                      style={{ gridTemplateColumns: "1fr 126px 126px 126px" }}
                    >
                      {/* Product info */}
                      <div className="flex gap-4 items-start">
                        <div className="w-20 h-20 bg-surface-container-low shrink-0 overflow-hidden rounded-card">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.name} width={80} height={80} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <p className="text-sm font-semibold text-primary leading-snug line-clamp-2">{item.name}</p>
                          <p className="text-xs text-on-surface-variant">{t("skuLabel")}: {item.sku}</p>
                          <CartStockBadge level={item.stockLevel} t={tProducts} />
                        </div>
                      </div>
                      <div className="text-center text-sm font-medium text-on-surface">{formatAmount(item.unitPrice)}</div>
                      <div className="flex justify-center">
                        <QtyStepper
                          qty={item.qty}
                          onDecrease={() => handleQtyCommit(item.itemId, item.sku, item.qty - 1)}
                          onIncrease={() => handleQtyCommit(item.itemId, item.sku, item.qty + 1)}
                          onCommit={(v) => handleQtyCommit(item.itemId, item.sku, v)}
                          onRemove={() => handleRemove(item)}
                          ariaLabel={t("qtyAriaLabel", { name: item.name })}
                          decreaseLabel={t("decreaseQuantity")}
                          increaseLabel={t("increaseQuantity")}
                          removeLabel={t("removeItem")}
                        />
                      </div>
                      <div className="text-right text-sm font-bold text-primary">{formatAmount(lineTotal)}</div>
                    </div>

                    {/* Mobile: stacked card */}
                    <div className="lg:hidden flex gap-3">
                      <div className="w-16 h-16 bg-surface-container-low shrink-0 overflow-hidden rounded-card">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <p className="text-sm font-semibold text-primary leading-snug line-clamp-2">{item.name}</p>
                        <p className="text-xs text-on-surface-variant">{t("skuLabel")}: {item.sku}</p>
                        <CartStockBadge level={item.stockLevel} t={tProducts} />
                        <div className="flex items-center justify-between mt-1">
                          <QtyStepper
                            qty={item.qty}
                            onDecrease={() => handleQtyCommit(item.itemId, item.sku, item.qty - 1)}
                            onIncrease={() => handleQtyCommit(item.itemId, item.sku, item.qty + 1)}
                            onCommit={(v) => handleQtyCommit(item.itemId, item.sku, v)}
                            onRemove={() => handleRemove(item)}
                            ariaLabel={t("qtyAriaLabel", { name: item.name })}
                            decreaseLabel={t("decreaseQuantity")}
                            increaseLabel={t("increaseQuantity")}
                            removeLabel={t("removeItem")}
                          />
                          <span className="text-sm font-bold text-primary">{formatAmount(lineTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions row */}
            <div className="mt-6 flex flex-col gap-3 border-t border-outline-variant/30 pt-4 sm:flex-row sm:justify-end sm:items-start">
                <CsvImportButton />
                <button
                  onClick={() => {
                    const csv = [
                      ["SKU", "Name", "Unit Price", "Qty", "Total"],
                      ...items.map((i) => [
                        i.sku,
                        `"${i.name}"`,
                        i.unitPrice.toFixed(2),
                        i.qty,
                        (i.unitPrice * i.qty).toFixed(2),
                      ]),
                    ]
                      .map((r) => r.join(","))
                      .join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "cart-export.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-wide border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors rounded-(--radius-btn)"
                >
                  {t("exportCsv")}
                </button>
            </div>
          </>
        )}
      </section>

      {/* ── Right: Order Summary Sidebar — only shown when cart has items ── */}
      {items.length > 0 && <aside className="w-full xl:w-[395px] xl:shrink-0">
        <div
          className="bg-surface-container-lowest p-6 rounded-card"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          {/* Heading */}
          <div className="flex items-center gap-3 mb-6">
            <svg width="18" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12h6M9 16h4" />
            </svg>
            <h2 className="text-lg font-bold text-primary">{t("orderSummary")}</h2>
          </div>

          {/* Subtotal */}
          <div className="flex justify-between items-center mb-3 text-sm">
            <span className="text-on-surface-variant font-medium">
              {t("subtotal", { count: items.reduce((s, i) => s + i.qty, 0) })}
            </span>
            <span className="font-semibold text-on-surface">{formatAmount(subtotal)}</span>
          </div>

          <p className="text-[11px] text-on-surface-variant/70 mb-6 leading-relaxed">
            {t("shippingAndTaxNote")}
          </p>

          {/* CTA › checkout flow */}
          <Link
            href="/checkout/address"
            className="w-full flex items-center justify-between px-6 py-4 bg-secondary text-white font-bold text-sm tracking-wide hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all rounded-(--radius-btn)"
          >
            <span>{t("proceedToCheckout")}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Legal disclaimer */}
          <p className="text-[10px] text-on-surface-variant/60 text-center mt-4 leading-relaxed">
            {t("legalDisclaimer")}
          </p>
        </div>

        {/* Trust signals */}
        <div className="mt-6 flex flex-col gap-5 px-2">
          <TrustSignal
            icon={
              <svg width="16" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0 mt-0.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
            label={t("trustIso")}
            description={t("trustIsoDesc")}
          />
          <TrustSignal
            icon={
              <svg width="20" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0 mt-0.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
            label={t("trustSupport")}
            description={t("trustSupportDesc")}
          />
        </div>
      </aside>}
    </div>
  );
}

function QtyStepper({
  qty,
  onDecrease,
  onIncrease,
  onCommit,
  onRemove,
  ariaLabel,
  decreaseLabel,
  increaseLabel,
  removeLabel,
}: {
  qty: number;
  onDecrease: () => Promise<void>;
  onIncrease: () => Promise<void>;
  onCommit: (v: number) => Promise<void>;
  onRemove: () => Promise<void>;
  ariaLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
  removeLabel: string;
}) {
  const [inputValue, setInputValue] = useState(String(qty));
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setInputValue(String(qty));
  }, [qty]);

  async function runAction(action: () => Promise<void>, fallback = String(qty)) {
    setIsPending(true);
    try {
      await action();
    } catch {
      setInputValue(fallback);
    } finally {
      setIsPending(false);
    }
  }

  async function commitTypedValue() {
    const raw = inputValue.trim();
    const parsed = Number.parseInt(raw, 10);

    if (!raw || Number.isNaN(parsed) || parsed < 1) {
      setInputValue(String(qty));
      return;
    }

    if (parsed === qty) {
      setInputValue(String(qty));
      return;
    }

    await runAction(() => onCommit(parsed));
  }

  return (
    <div className="flex items-center border border-outline-variant/50 rounded-(--radius-input) overflow-hidden h-11 sm:h-9">
      {qty <= 1 ? (
        <button
          onClick={() => void runAction(onRemove)}
          disabled={isPending}
          aria-label={removeLabel}
          className="flex items-center justify-center w-11 sm:w-8 h-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      ) : (
        <button
          onClick={() => void runAction(onDecrease)}
          disabled={isPending}
          aria-label={decreaseLabel}
          className="flex items-center justify-center w-11 sm:w-8 h-full text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
      <input
        type="number"
        min={1}
        inputMode="numeric"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onClick={(e) => e.currentTarget.select()}
        onBlur={() => void commitTypedValue()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void commitTypedValue();
          }
          if (e.key === "Escape") {
            setInputValue(String(qty));
            e.currentTarget.blur();
          }
        }}
        disabled={isPending}
        className="w-11 sm:w-9 text-center text-sm font-medium bg-transparent border-x border-outline-variant/30 focus:outline-none py-1 text-on-surface disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label={ariaLabel}
      />
      <button
        onClick={() => void runAction(onIncrease)}
        disabled={isPending}
        aria-label={increaseLabel}
        className="flex items-center justify-center w-11 sm:w-8 h-full text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}

function CartStockBadge({
  level,
  t,
}: {
  level: StockLevel;
  t: (key: "inStock" | "lowStock" | "outOfStock") => string;
}) {
  if (level === "unknown") return null;
  const label =
    level === "in"
      ? t("inStock")
      : level === "low"
      ? t("lowStock")
      : t("outOfStock");
  return <StockBadge level={level} label={label} />;
}

function CartSkeleton({ label }: { label: string }) {
  return (
    <div className="py-10" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="divide-y divide-outline-variant/30">
        {[0, 1, 2].map((k) => (
          <div key={k} className="py-5 px-4 flex gap-4 items-start animate-pulse">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-surface-container-low shrink-0 rounded-card" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-3 w-3/5 bg-surface-container-low rounded" />
              <div className="h-3 w-1/3 bg-surface-container-low rounded" />
              <div className="h-3 w-1/4 bg-surface-container-low rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustSignal({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      {icon}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-primary mb-1">{label}</p>
        <p className="text-xs text-on-surface-variant leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
