import { Link } from "@/i18n/navigation";
import {
  serviceKindAccent,
  serviceStatusTone,
  type ServiceCaseSummary,
} from "@/lib/service";

interface ServiceCaseRowProps {
  case: ServiceCaseSummary;
  locale: string;
  labels: {
    kind: Record<ServiceCaseSummary["kind"], string>;
    status: Record<ServiceCaseSummary["status"], string>;
    viewCase: string;
    orderLabel: string;
    machineLabel: string;
    updated: string;
  };
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ServiceCaseRow({
  case: c,
  locale,
  labels,
}: ServiceCaseRowProps) {
  return (
    <Link
      href={`/account/service/${c.id}`}
      className="group flex flex-col gap-3 p-5 bg-surface-container-lowest hover:bg-primary-fixed transition-colors"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${serviceKindAccent(c.kind)}`}
          style={{ borderRadius: "var(--radius-btn)" }}
        >
          {labels.kind[c.kind]}
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${serviceStatusTone(c.status)}`}
          style={{ borderRadius: "var(--radius-btn)" }}
        >
          {labels.status[c.status]}
        </span>
        <span className="ml-auto text-xs font-mono text-on-surface-variant">
          {c.id}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-base font-black text-primary uppercase tracking-[-0.01em]">
          {c.machineLabel ??
            (c.orderIncrementId
              ? `${labels.orderLabel} #${c.orderIncrementId}`
              : c.id)}
        </span>
        <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
          {c.description}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-outline-variant/30">
        <span className="text-xs text-on-surface-variant">
          {labels.updated}: {formatDate(c.updatedAt, locale)}
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-primary shrink-0 group-hover:translate-x-0.5 transition-transform">
          {labels.viewCase} ›
        </span>
      </div>
    </Link>
  );
}
