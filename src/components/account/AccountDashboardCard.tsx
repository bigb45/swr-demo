import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export type AccountDashboardBadgeTone = "primary" | "danger";

interface AccountDashboardCardProps {
  href: string;
  title: string;
  tagline: string;
  icon: ReactNode;
  badge?: string | null;
  badgeTone?: AccountDashboardBadgeTone;
}

export function AccountDashboardCard({
  href,
  title,
  tagline,
  icon,
  badge,
  badgeTone = "primary",
}: AccountDashboardCardProps) {
  const badgeBg =
    badgeTone === "danger"
      ? "bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]"
      : "bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]";
  const badgeTextClass =
    badgeTone === "danger" ? "text-[var(--color-error)]" : "text-primary";

  return (
    <Link
      href={href}
      className="group flex min-h-40 flex-col justify-between border-b-2 border-b-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-surface-container-lowest px-6 pb-6 pt-6 transition-[border-color,box-shadow] hover:border-b-primary hover:shadow-ambient"
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className="shrink-0 text-primary [&_svg]:text-primary">{icon}</span>
        {badge ? (
          <span
            className={`shrink-0 px-2 py-1 text-[10px] font-black uppercase leading-4 tracking-[0.06em] ${badgeBg} ${badgeTextClass}`}
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-lg font-bold leading-7 tracking-tight text-primary">
          {title}
        </span>
        <span className="text-xs font-normal uppercase leading-4 tracking-[0.05em] text-on-surface-variant">
          {tagline}
        </span>
      </div>
    </Link>
  );
}
