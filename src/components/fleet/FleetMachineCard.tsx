import { Link } from "@/i18n/navigation";
import { warrantyStatus, type Machine } from "@/lib/fleet";

interface FleetMachineCardProps {
  machine: Machine;
  labels: {
    serial: string;
    purchased: string;
    warrantyUntil: string;
    statusActive: string;
    statusExpiring: string;
    statusExpired: string;
    viewDetails: string;
    lastService: string;
    noService: string;
  };
  locale: string;
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

export default function FleetMachineCard({
  machine,
  labels,
  locale,
}: FleetMachineCardProps) {
  const status = warrantyStatus(machine);
  const statusLabel =
    status === "active"
      ? labels.statusActive
      : status === "expiring"
        ? labels.statusExpiring
        : labels.statusExpired;
  const statusBg =
    status === "active"
      ? "bg-secondary text-white"
      : status === "expiring"
        ? "bg-warning/10 text-warning"
        : "bg-error/10 text-error";

  const lastService = machine.maintenance[0];

  return (
    <Link
      href={`/account/fleet/${machine.id}`}
      className="group flex flex-col bg-surface-container-lowest hover:bg-primary-fixed transition-colors p-5 gap-4"
      style={{ borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-ambient)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-secondary">
            {machine.brand}
          </span>
          <span className="text-lg font-black text-primary uppercase tracking-[-0.01em] truncate">
            {machine.model}
          </span>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 shrink-0 ${statusBg}`}
          style={{ borderRadius: "var(--radius-btn)" }}
        >
          {statusLabel}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div className="flex flex-col">
          <dt className="text-on-surface-variant uppercase tracking-[0.08em]">
            {labels.serial}
          </dt>
          <dd className="font-mono text-on-surface">{machine.serial}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-on-surface-variant uppercase tracking-[0.08em]">
            {labels.purchased}
          </dt>
          <dd className="font-mono text-on-surface">
            {formatDate(machine.purchasedAt, locale)}
          </dd>
        </div>
        <div className="flex flex-col col-span-2">
          <dt className="text-on-surface-variant uppercase tracking-[0.08em]">
            {labels.warrantyUntil}
          </dt>
          <dd className="font-mono text-on-surface">
            {formatDate(machine.warrantyUntil, locale)}
          </dd>
        </div>
      </dl>

      <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2">
        <span className="text-xs text-on-surface-variant truncate">
          {lastService
            ? `${labels.lastService}: ${formatDate(lastService.date, locale)}`
            : labels.noService}
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-primary shrink-0 group-hover:translate-x-0.5 transition-transform">
          {labels.viewDetails} →
        </span>
      </div>
    </Link>
  );
}
