"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/CartProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import Image from "next/image";
import { useState } from "react";

type ShippingOption = "standard" | "expedited";

const VAT_RATE = 0.19;
const EXPEDITED_COST = 45;

export default function CartContent() {
  const t = useTranslations("cart");
  const { items, updateQty, removeItem } = useCart();
  const { formatAmount } = useCurrency();
  const [shipping, setShipping] = useState<ShippingOption>("standard");

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const shippingCost = shipping === "expedited" ? EXPEDITED_COST : 0;
  const vat = (subtotal + shippingCost) * VAT_RATE;
  const total = subtotal + shippingCost + vat;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-8 items-start">
      {/* ── Left: Cart Items ──────────────────────────────────────── */}
      <section className="flex-1 min-w-0">
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

        {items.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant">
            <p className="text-lg font-medium mb-4">{t("empty")}</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              ← {t("continueProcurement")}
            </Link>
          </div>
        ) : (
          <>
            {/* Table header — desktop only */}
            <div
              className="hidden sm:grid text-xs font-semibold uppercase tracking-wide text-on-surface-variant bg-surface-container-low px-4 py-2"
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
                      className="hidden sm:grid items-center gap-4"
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
                          <StockBadge status={item.stockStatus} label={item.stockLabel} />
                          <button onClick={() => removeItem(item.itemId)} className="mt-1 text-xs text-on-surface-variant/60 hover:text-red-600 transition-colors text-left">
                            {t("remove")}
                          </button>
                        </div>
                      </div>
                      <div className="text-center text-sm font-medium text-on-surface">{formatAmount(item.unitPrice)}</div>
                      <div className="flex justify-center">
                        <div className="relative flex items-center border border-outline-variant/50 rounded-(--radius-input) overflow-hidden h-8 w-16">
                          <input type="number" min={1} value={item.qty} onChange={(e) => updateQty(item.itemId, item.sku, Math.max(1, parseInt(e.target.value) || 1))} className="w-full text-center text-sm font-medium bg-transparent border-0 focus:outline-none py-1 pr-4 text-on-surface" aria-label={t("qtyAriaLabel", { name: item.name })} />
                          <div className="absolute right-0 top-0 bottom-0 w-4 flex flex-col border-l border-outline-variant/30">
                            <button onClick={() => updateQty(item.itemId, item.sku, item.qty + 1)} className="flex-1 flex items-center justify-center text-[8px] text-on-surface-variant hover:bg-surface-container-low leading-none" aria-label="Increase">▲</button>
                            <button onClick={() => updateQty(item.itemId, item.sku, item.qty - 1)} className="flex-1 flex items-center justify-center text-[8px] text-on-surface-variant hover:bg-surface-container-low border-t border-outline-variant/30 leading-none" aria-label="Decrease">▼</button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm font-bold text-primary">{formatAmount(lineTotal)}</div>
                    </div>

                    {/* Mobile: stacked card */}
                    <div className="sm:hidden flex gap-3">
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
                        <StockBadge status={item.stockStatus} label={item.stockLabel} />
                        <div className="flex items-center justify-between mt-1">
                          <div className="relative flex items-center border border-outline-variant/50 rounded-(--radius-input) overflow-hidden h-8 w-16">
                            <input type="number" min={1} value={item.qty} onChange={(e) => updateQty(item.itemId, item.sku, Math.max(1, parseInt(e.target.value) || 1))} className="w-full text-center text-sm font-medium bg-transparent border-0 focus:outline-none py-1 pr-4 text-on-surface" aria-label={t("qtyAriaLabel", { name: item.name })} />
                            <div className="absolute right-0 top-0 bottom-0 w-4 flex flex-col border-l border-outline-variant/30">
                              <button onClick={() => updateQty(item.itemId, item.sku, item.qty + 1)} className="flex-1 flex items-center justify-center text-[8px] text-on-surface-variant hover:bg-surface-container-low leading-none" aria-label="Increase">▲</button>
                              <button onClick={() => updateQty(item.itemId, item.sku, item.qty - 1)} className="flex-1 flex items-center justify-center text-[8px] text-on-surface-variant hover:bg-surface-container-low border-t border-outline-variant/30 leading-none" aria-label="Decrease">▼</button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-primary">{formatAmount(lineTotal)}</span>
                            <button onClick={() => removeItem(item.itemId)} className="text-xs text-on-surface-variant/60 hover:text-red-600 transition-colors">
                              {t("remove")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions row */}
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-outline-variant/30">
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
                <button
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-wide border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors rounded-(--radius-btn)"
                >
                  {t("saveForLater")}
                </button>
            </div>
          </>
        )}
      </section>

      {/* ── Right: Order Summary Sidebar ─────────────────────────── */}
      <aside className="w-full lg:w-[395px] lg:shrink-0">
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
          <div className="flex justify-between items-center mb-6 text-sm">
            <span className="text-on-surface-variant font-medium">
              {t("subtotal", { count: items.reduce((s, i) => s + i.qty, 0) })}
            </span>
            <span className="font-semibold text-on-surface">{formatAmount(subtotal)}</span>
          </div>

          {/* Logistics Strategy */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">
              {t("logisticsStrategy")}
            </p>
            <div className="flex flex-col gap-2">
              {/* Standard */}
              <label
                className={`flex items-center justify-between px-4 py-3 border cursor-pointer transition-colors rounded-(--radius-input) ${
                  shipping === "standard"
                    ? "border-primary bg-primary-fixed/30"
                    : "border-outline-variant/50 hover:border-outline-variant"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      shipping === "standard" ? "border-primary" : "border-outline-variant"
                    }`}
                  >
                    {shipping === "standard" && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-on-surface">
                      {t("standardFreight")}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">{t("standardFreightDays")}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-secondary">{t("free")}</span>
                <input
                  type="radio"
                  name="shipping"
                  value="standard"
                  checked={shipping === "standard"}
                  onChange={() => setShipping("standard")}
                  className="sr-only"
                />
              </label>

              {/* Expedited */}
              <label
                className={`flex items-center justify-between px-4 py-3 border cursor-pointer transition-colors rounded-(--radius-input) ${
                  shipping === "expedited"
                    ? "border-primary bg-primary-fixed/30"
                    : "border-outline-variant/50 hover:border-outline-variant"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      shipping === "expedited" ? "border-primary" : "border-outline-variant"
                    }`}
                  >
                    {shipping === "expedited" && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-on-surface">
                      {t("expeditedLogistics")}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">{t("expeditedLogisticsDays")}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-on-surface">
                  {formatAmount(EXPEDITED_COST)}
                </span>
                <input
                  type="radio"
                  name="shipping"
                  value="expedited"
                  checked={shipping === "expedited"}
                  onChange={() => setShipping("expedited")}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* VAT */}
          <div className="flex justify-between items-center py-4 border-t border-outline-variant/30 text-sm">
            <span className="text-on-surface-variant">{t("estimatedVat")}</span>
            <span className="font-medium text-on-surface">{formatAmount(vat)}</span>
          </div>

          {/* Total */}
          <div className="flex justify-between items-end py-4 border-t border-outline-variant/30 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-0.5">
                {t("totalAmountDue")}
              </p>
              <p className="text-[11px] text-on-surface-variant/70">{t("inclSurcharges")}</p>
            </div>
            <span className="text-2xl font-black text-primary tabular-nums">
              {formatAmount(total)}
            </span>
          </div>

          {/* CTA */}
          <button
            disabled={items.length === 0}
            className="w-full flex items-center justify-between px-6 py-4 bg-secondary text-white font-bold text-sm uppercase tracking-wide hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded-(--radius-btn)"
          >
            <span>{t("placeAuthorizationOrder")}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

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
      </aside>
    </div>
  );
}

function StockBadge({
  status,
  label,
}: {
  status: "in_stock" | "lead_time" | "unavailable";
  label: string;
}) {
  const colors =
    status === "in_stock"
      ? "text-success"
      : status === "lead_time"
      ? "text-warning"
      : "text-error";

  return (
    <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${colors}`}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
        <circle cx="4" cy="4" r="4" />
      </svg>
      {label}
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
