import { Link } from "@/i18n/navigation";

interface IntentTileProps {
  question: string;
  answer: string;
  href: string;
  ctaLabel: string;
  index: number;
}

// Big, deliberately type-heavy tile. Reads like a customer's actual question
// rather than a generic SaaS category icon.
export default function IntentTile({
  question,
  answer,
  href,
  ctaLabel,
  index,
}: IntentTileProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 p-6 sm:p-8 bg-surface-container-lowest hover:bg-surface-container-low transition-colors h-full"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary tabular-nums">
        {String(index).padStart(2, "0")}
      </span>
      <h3 className="text-xl sm:text-2xl font-black text-primary leading-tight tracking-[-0.01em]">
        {question}
      </h3>
      <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
        {answer}
      </p>
      <span className="text-xs font-bold uppercase tracking-[0.05em] text-primary group-hover:underline mt-auto inline-flex items-center gap-1.5">
        {ctaLabel}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </Link>
  );
}
