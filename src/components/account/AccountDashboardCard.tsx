import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export type AccountDashboardMetaTone = "primary" | "danger";

interface AccountDashboardCardProps {
  href: string;
  title: string;
  tagline: string;
  icon: ReactNode;
  /** Functional count/status text — not a decorative stamp. */
  meta?: string | null;
  metaTone?: AccountDashboardMetaTone;
}

export function AccountDashboardCard({
  href,
  title,
  tagline,
  icon,
  meta,
  metaTone = "primary",
}: AccountDashboardCardProps) {
  const metaClass =
    metaTone === "danger" ? "text-[var(--color-error)]" : "text-primary";

  return (
    <Link
      href={href}
      className="group flex min-h-32 flex-col justify-between bg-surface-container-lowest px-5 pb-5 pt-5 transition-[background-color,box-shadow] hover:bg-primary-fixed hover:shadow-ambient"
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className="shrink-0 text-primary [&_svg]:text-primary">{icon}</span>
        {meta ? (
          <span className={`shrink-0 text-xs font-semibold ${metaClass}`}>
            {meta}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-bold leading-snug tracking-tight text-primary">
          {title}
        </span>
        <span className="text-xs leading-relaxed text-on-surface-variant">
          {tagline}
        </span>
      </div>
    </Link>
  );
}
