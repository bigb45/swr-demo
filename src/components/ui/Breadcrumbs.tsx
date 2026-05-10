import { Fragment } from "react";
import { Link } from "@/i18n/navigation";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  ariaLabel: string;
  className?: string;
}

export default function Breadcrumbs({
  items,
  ariaLabel,
  className = "",
}: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      className={`flex flex-wrap items-center gap-2 text-xs text-on-surface-variant ${className}`}
      aria-label={ariaLabel}
    >
      {items.map((item, idx) => {
        const isCurrent = idx === items.length - 1;
        const showLink =
          typeof item.href === "string" && item.href.length > 0 && !isCurrent;

        return (
          <Fragment key={`${idx}-${item.label.slice(0, 12)}`}>
            {idx > 0 ? (
              <span
                className="opacity-40 select-none"
                aria-hidden
              >
                /
              </span>
            ) : null}
            {showLink ? (
              <Link
                href={item.href!}
                className="hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isCurrent
                    ? "text-on-surface font-medium truncate max-w-[min(100%,280px)]"
                    : undefined
                }
              >
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
