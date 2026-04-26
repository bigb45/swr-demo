import {
  serviceStatusTone,
  type ServiceCaseStatus,
  type ServiceEvent,
} from "@/lib/service";

interface ServiceTimelineProps {
  events: ServiceEvent[];
  locale: string;
  labels: {
    status: Record<ServiceCaseStatus, string>;
    customer: string;
    swr: string;
  };
}

function formatDateTime(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ServiceTimeline({
  events,
  locale,
  labels,
}: ServiceTimelineProps) {
  if (events.length === 0) return null;
  const ordered = [...events].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  return (
    <ol className="flex flex-col gap-0">
      {ordered.map((ev, i) => (
        <li
          key={ev.id}
          className="flex gap-4 relative pb-6 last:pb-0"
        >
          <div className="flex flex-col items-center shrink-0">
            <span
              className={`w-3 h-3 mt-1.5 ${serviceStatusTone(ev.status)}`}
              style={{ borderRadius: "999px" }}
              aria-hidden
            />
            {i < ordered.length - 1 ? (
              <span className="flex-1 w-px bg-outline-variant/50 mt-1" aria-hidden />
            ) : null}
          </div>
          <div className="flex flex-col gap-1 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${serviceStatusTone(ev.status)}`}
                style={{ borderRadius: "var(--radius-btn)" }}
              >
                {labels.status[ev.status]}
              </span>
              <span className="text-xs font-mono text-on-surface-variant">
                {formatDateTime(ev.at, locale)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                · {ev.author === "customer" ? labels.customer : labels.swr}
              </span>
            </div>
            {ev.note ? (
              <p className="text-sm text-on-surface leading-relaxed">
                {ev.note}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
