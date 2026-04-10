interface BentoSectionProps {
  /** Large left card (~66%) */
  primary: React.ReactNode;
  /** Small right card (~34%) */
  secondary: React.ReactNode;
  className?: string;
}

/**
 * Asymmetric 2-column bento layout.
 * Left card takes ~66%, right card ~34%.
 * Cards use tonal layering — no borders.
 */
export default function BentoSection({
  primary,
  secondary,
  className = "",
}: BentoSectionProps) {
  return (
    <div className={`flex flex-col lg:flex-row gap-6 ${className}`}>
      {/* Primary — full width on mobile, ~66% on desktop */}
      <div
        className="flex-[2] bg-surface-container-lowest shadow-ambient p-6 sm:p-10 flex flex-col justify-between"
        style={{ borderRadius: "var(--radius-card)" }}
      >
        {primary}
      </div>

      {/* Secondary — full width on mobile, ~34% on desktop */}
      <div
        className="flex-1 bg-surface-container-low p-6 sm:p-8 flex flex-col"
        style={{ borderRadius: "var(--radius-card)" }}
      >
        {secondary}
      </div>
    </div>
  );
}
