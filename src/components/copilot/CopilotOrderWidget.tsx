"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CopilotOrderRow } from "./types";

/**
 * Renders the rows of a Teia `order_list` reply (order-history) inside the
 * Copilot thread — the counterpart to {@link CopilotProductWidget} for orders.
 * The backend emits order_number / date / total / status; deep-links target the
 * account order list (the artifact carries no stable per-order entity id).
 */
export default function CopilotOrderWidget({
  orders,
}: {
  orders: CopilotOrderRow[];
}) {
  const t = useTranslations("copilot");
  const locale = useLocale();

  const formatDate = (value?: string): string => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    try {
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(parsed);
    } catch {
      return value;
    }
  };

  if (orders.length === 0) return null;

  return (
    <div
      className="rounded-[var(--radius-card)] border border-outline-variant/40 bg-surface-container-lowest shadow-[var(--shadow-ambient)]"
      style={{ borderRadius: "var(--radius-card)" }}
    >
      <ul className="divide-y divide-outline-variant/25">
        {orders.map((order) => (
          <li
            key={order.orderNumber}
            className="flex items-center justify-between gap-3 px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-on-surface">
                  {t("orderNumberLabel", { number: order.orderNumber })}
                </span>
                {order.status ? (
                  <span className="inline-block rounded-[var(--radius-btn)] bg-surface-container-highest px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                    {order.status}
                  </span>
                ) : null}
              </div>
              {order.date ? (
                <p className="text-xs text-on-surface-variant">
                  {formatDate(order.date)}
                </p>
              ) : null}
            </div>
            {order.total ? (
              <span className="shrink-0 text-sm font-bold tabular-nums text-on-surface">
                {order.total}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="border-t border-outline-variant/25 px-3 py-2">
        <Link
          href="/orders"
          className="text-xs font-bold text-secondary hover:underline"
        >
          {t("ordersViewAll")}
        </Link>
      </div>
    </div>
  );
}
