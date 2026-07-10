"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useWatchlist } from "@/components/WatchlistProvider";

export default function WatchlistPageClient() {
  const t = useTranslations("watchlist");
  const { ready, items, remove, clear } = useWatchlist();

  if (!ready) {
    return (
      <div className="min-h-[40vh]" aria-hidden />
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card bg-surface-container-lowest px-6 py-16 text-center shadow-ambient">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant"
          aria-hidden
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-bold text-on-surface">{t("title")}</h1>
          <p className="text-sm text-on-surface-variant">{t("empty")}</p>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:brightness-110"
          style={{ borderRadius: "var(--radius-btn)" }}
        >
          {t("browseShop")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold text-on-surface">
          {t("title")}{" "}
          <span className="text-on-surface-variant">({items.length})</span>
        </h1>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-semibold text-on-surface-variant underline hover:text-on-surface"
        >
          {t("clearAll")}
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const href = `/products/${encodeURIComponent(item.sku)}`;
          return (
            <li
              key={item.sku}
              className="flex items-center gap-4 rounded-card bg-surface-container-lowest p-3 sm:p-4 shadow-ambient"
            >
              <Link
                href={href}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-(--radius-btn) bg-surface-container-low"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-[10px] text-on-surface-variant/50">
                    -
                  </span>
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-mono text-[11px] uppercase tracking-wide text-on-surface-variant">
                  {item.sku}
                </span>
                <Link
                  href={href}
                  className="line-clamp-2 text-sm font-semibold text-primary hover:underline"
                >
                  {item.name}
                </Link>
              </div>

              <button
                type="button"
                onClick={() => remove(item.sku)}
                aria-label={t("remove")}
                title={t("remove")}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-error"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
