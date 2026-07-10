interface DemoDataNoticeProps {
  label: string;
  className?: string;
}

/**
 * Tonal banner marking a section as demo / in-process data (no ERP wiring
 * yet). Deliberately border-free per the design system's tonal hierarchy.
 */
export default function DemoDataNotice({
  label,
  className = "",
}: DemoDataNoticeProps) {
  return (
    <p
      role="note"
      className={`flex items-start gap-2 bg-surface-container-highest px-4 py-3 text-xs leading-relaxed text-on-surface-variant ${className}`}
      style={{ borderRadius: "var(--radius-card)" }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="mt-0.5 shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{label}</span>
    </p>
  );
}
