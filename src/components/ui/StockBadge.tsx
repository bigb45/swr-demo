import type { StockLevel } from "@/lib/stock";

interface StockBadgeProps {
  level: StockLevel;
  /** Pre-translated label (e.g. "IN STOCK", "LOW STOCK", "OUT OF STOCK"). */
  label: string;
  /**
   * Visual size. "sm" matches the compact treatment used on product cards and
   * cart rows; "md" matches the more prominent chip on the PDP gallery.
   */
  size?: "sm" | "md";
  /**
   * "chip" renders a filled pill (used as an absolute overlay on the gallery).
   * "inline" renders a dot + text without a background, for use inside cards.
   */
  variant?: "chip" | "inline";
  className?: string;
}

/**
 * Shared availability indicator. Colour palette is driven by the semantic
 * design tokens (`success`, `warning`, `error`) — no one-off hex values.
 * "unknown" is treated as a muted neutral so the UI never shouts when the
 * backend couldn't resolve stock at all.
 */
export default function StockBadge({
  level,
  label,
  size = "sm",
  variant = "inline",
  className = "",
}: StockBadgeProps) {
  const tone = TONES[level];

  if (variant === "chip") {
    const sizeClass =
      size === "md"
        ? "px-3 py-1 text-xs"
        : "px-2 py-0.5 text-[10px]";
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide text-white ${sizeClass} ${tone.chipBg} ${className}`}
        style={{ borderRadius: "var(--radius-btn)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white/90" aria-hidden />
        {label}
      </span>
    );
  }

  const textClass =
    size === "md" ? "text-xs" : "text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide ${textClass} ${tone.text} ${className}`}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden>
        <circle cx="4" cy="4" r="4" />
      </svg>
      {label}
    </span>
  );
}

const TONES: Record<StockLevel, { text: string; chipBg: string }> = {
  in: { text: "text-success", chipBg: "bg-secondary" },
  low: { text: "text-warning", chipBg: "bg-warning" },
  out: { text: "text-error", chipBg: "bg-error" },
  unknown: {
    text: "text-on-surface-variant",
    chipBg: "bg-on-surface-variant",
  },
};
