import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

interface CtaProps {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "white";
  icon?: ReactNode;
}

export default function Cta({
  href,
  label,
  variant = "primary",
  icon,
}: CtaProps) {
  const base =
    "inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-bold transition-all";
  const radius = { borderRadius: "var(--radius-btn)" } as const;

  if (variant === "primary") {
    return (
      <Link
        href={href}
        className={`${base} bg-secondary text-white hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]`}
        style={radius}
      >
        {label}
        {icon ?? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        )}
      </Link>
    );
  }

  if (variant === "secondary") {
    return (
      <Link
        href={href}
        className={`${base} bg-primary text-white hover:brightness-110`}
        style={radius}
      >
        {label}
        {icon}
      </Link>
    );
  }

  if (variant === "white") {
    return (
      <Link
        href={href}
        className={`${base} bg-transparent text-white border border-white/40 hover:bg-white/10`}
        style={radius}
      >
        {label}
        {icon}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`${base} bg-transparent text-primary border border-primary/30 hover:bg-primary/5`}
      style={radius}
    >
      {label}
      {icon}
    </Link>
  );
}
