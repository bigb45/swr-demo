interface CertificateCardProps {
  title: string;
  issuer?: string;
  validUntil?: string;
  href?: string;
  downloadLabel: string;
}

export default function CertificateCard({
  title,
  issuer,
  validUntil,
  href,
  downloadLabel,
}: CertificateCardProps) {
  const Tag = href ? "a" : "div";
  return (
    <Tag
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      className="group flex items-start gap-4 p-6 bg-surface-container-lowest transition-shadow hover:shadow-md"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center bg-primary/10 text-primary"
        style={{ borderRadius: "var(--radius-interactive)" }}
        aria-hidden="true"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
          <line x1="9" y1="11" x2="15" y2="11" />
        </svg>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-sm font-black uppercase tracking-[0.02em] text-primary">
          {title}
        </h3>
        {issuer ? (
          <p className="text-xs text-on-surface-variant">{issuer}</p>
        ) : null}
        {validUntil ? (
          <p className="text-xs text-on-surface-variant/80">{validUntil}</p>
        ) : null}
        {href ? (
          <span className="mt-2 text-xs font-semibold text-primary underline group-hover:no-underline">
            {downloadLabel}
          </span>
        ) : null}
      </div>
    </Tag>
  );
}
