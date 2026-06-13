"use client";

import type { MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { useWatchlist } from "./WatchlistProvider";

interface WatchlistButtonProps {
  sku: string;
  name: string;
  imageUrl: string | null;
  /** "icon" = compact heart toggle; "full" = labelled block button. */
  variant?: "icon" | "full";
  /** Icon-variant box size. "md" (44px) matches PDP/card; "sm" (36px) for rows. */
  size?: "sm" | "md";
  className?: string;
}

function HeartIcon({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function WatchlistButton({
  sku,
  name,
  imageUrl,
  variant = "icon",
  size = "md",
  className = "",
}: WatchlistButtonProps) {
  const t = useTranslations("watchlist");
  const { ready, has, toggle } = useWatchlist();
  const active = ready && has(sku);

  function onClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle({ sku, name, imageUrl });
  }

  const label = active ? t("remove") : t("add");

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`inline-flex w-full items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold tracking-wide transition-colors ${
          active
            ? "bg-primary/10 text-primary"
            : "bg-surface-container-low text-primary hover:bg-primary-fixed/40"
        } ${className}`}
        style={{ borderRadius: "var(--radius-btn)" }}
      >
        <HeartIcon filled={active} size={16} />
        <span>{active ? t("added") : t("add")}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-(--radius-btn) border transition-colors ${
        size === "sm" ? "h-9 w-9" : "h-11 w-11"
      } ${
        active
          ? "border-secondary bg-secondary/10 text-secondary"
          : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-secondary hover:text-secondary"
      } ${className}`}
    >
      <HeartIcon filled={active} size={size === "sm" ? 16 : 18} />
    </button>
  );
}
