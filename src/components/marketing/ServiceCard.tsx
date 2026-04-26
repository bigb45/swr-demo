import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

interface ServiceCardProps {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
}

export default function ServiceCard({
  icon,
  eyebrow,
  title,
  description,
  href,
  ctaLabel,
}: ServiceCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 p-6 bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      {icon ? <div className="text-primary">{icon}</div> : null}
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-secondary">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="text-xl font-black uppercase tracking-[-0.01em] text-primary">
        {title}
      </h3>
      <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
        {description}
      </p>
      <span className="text-xs font-bold uppercase tracking-[0.05em] text-primary group-hover:underline mt-auto inline-flex items-center gap-1">
        {ctaLabel}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </Link>
  );
}
