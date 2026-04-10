interface CertBadgeProps {
  icon?: React.ReactNode;
  label: string;
}

/**
 * Small certification/compliance pill badge.
 * Subtle border using ghost-border rule (outline-variant at 15% opacity).
 */
export default function CertBadge({ icon, label }: CertBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-on-surface-variant bg-surface-container-low"
      style={{
        borderRadius: "var(--radius-btn)",
        border: "1px solid rgba(193,199,209,0.15)",
      }}
    >
      {icon && (
        <span className="text-secondary shrink-0">{icon}</span>
      )}
      {label}
    </span>
  );
}
