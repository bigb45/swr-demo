"use client";

import { useTranslations } from "next-intl";

interface NoImagePlaceholderProps {
  /** `card` = compact product grid tile; `gallery` = larger PDP main image area. */
  variant?: "card" | "gallery";
  className?: string;
}

/**
 * Shared empty-state for products without catalog images.
 */
export default function NoImagePlaceholder({
  variant = "card",
  className = "",
}: NoImagePlaceholderProps) {
  const t = useTranslations("products");
  const iconClass = variant === "gallery" ? "w-24 h-24" : "w-16 h-16";
  const labelClass =
    variant === "gallery"
      ? "text-sm text-on-surface-variant"
      : "text-xs text-on-surface-variant";

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-container-low ${className}`}
      aria-hidden
    >
      <svg
        className={`${iconClass} text-outline-variant`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span className={labelClass}>{t("noImage")}</span>
    </div>
  );
}
