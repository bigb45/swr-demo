import { Link } from "@/i18n/navigation";
import type { WarrantyStatus } from "@/lib/fleet";
import type { ServiceCaseKind } from "@/lib/service";

export interface PickableMachine {
  id: string;
  brand: string;
  model: string;
  serial: string;
  warranty: WarrantyStatus;
  warrantyUntil: string;
  lastServiceAt?: string;
}

interface FleetMachinePickerProps {
  kind: ServiceCaseKind;
  machines: PickableMachine[];
  locale: string;
  /** When set (e.g. repair from an order), preserve on machine selection. */
  orderId?: string;
  labels: {
    heading: string;
    subheading: string;
    selectCta: string;
    warranty: Record<WarrantyStatus, string>;
    warrantyUntil: string;
    serial: string;
    lastService: string;
    noService: string;
    empty: {
      heading: string;
      body: string;
      cta: string;
    };
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

function newCaseHref(
  kind: ServiceCaseKind,
  machineId: string,
  orderId: string | undefined,
): string {
  const p = new URLSearchParams();
  p.set("kind", kind);
  p.set("machineId", machineId);
  if (orderId) p.set("orderId", orderId);
  return `/account/service/new?${p.toString()}`;
}

export default function FleetMachinePicker({
  kind,
  machines,
  locale,
  orderId,
  labels,
}: FleetMachinePickerProps) {
  if (machines.length === 0) {
    return (
      <section
        className="flex flex-col gap-3 p-6 sm:p-8 bg-surface-container-low"
        style={{
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-ambient)",
        }}
      >
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
          {labels.heading}
        </h2>
        <h3 className="text-lg font-black text-primary uppercase tracking-[-0.01em]">
          {labels.empty.heading}
        </h3>
        <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
          {labels.empty.body}
        </p>
        <Link
          href="/contact"
          className="self-start text-xs font-bold uppercase tracking-[0.12em] bg-primary text-white px-4 py-3 hover:bg-primary-container transition-colors"
          style={{ borderRadius: "var(--radius-btn)" }}
        >
          {labels.empty.cta}
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-col gap-1 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
          {labels.heading}
        </p>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {labels.subheading}
        </p>
      </header>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {machines.map((m) => {
          const statusLabel = labels.warranty[m.warranty];
          const statusBg =
            m.warranty === "active"
              ? "bg-secondary text-white"
              : m.warranty === "expiring"
                ? "bg-warning/10 text-warning"
                : "bg-error/10 text-error";
          return (
            <li key={m.id}>
              <Link
                href={newCaseHref(kind, m.id, orderId)}
                replace
                className="group flex flex-col gap-3 p-5 bg-surface-container-lowest hover:bg-primary-fixed transition-colors"
                style={{
                  borderRadius: "var(--radius-card)",
                  boxShadow: "var(--shadow-ambient)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-secondary">
                      {m.brand}
                    </span>
                    <span className="text-base font-black text-primary uppercase tracking-[-0.01em] truncate">
                      {m.model}
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
                      {labels.warrantyUntil}
                    </dt>
                    <dd className="font-mono text-on-surface">
                      {formatDate(m.warrantyUntil, locale)}
                    </dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-on-surface-variant uppercase tracking-[0.08em]">
                      {labels.lastService}
                    </dt>
                    <dd className="font-mono text-on-surface">
                      {m.lastServiceAt
                        ? formatDate(m.lastServiceAt, locale)
                        : labels.noService}
                    </dd>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <dt className="text-on-surface-variant uppercase tracking-[0.08em]">
                      {labels.serial}
                    </dt>
                    <dd className="font-mono text-on-surface">{m.serial}</dd>
                  </div>
                </dl>
                <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-end">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary group-hover:translate-x-0.5 transition-transform">
                    {labels.selectCta} ›
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
