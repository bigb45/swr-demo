import { Link } from "@/i18n/navigation";
import SpecTable from "@/components/ui/SpecTable";
import type { MaintenanceRecord, MaintenanceKind } from "@/lib/fleet";

interface MaintenanceLogTableProps {
  records: MaintenanceRecord[];
  labels: {
    columns: { date: string; kind: string; title: string; technician: string; document: string };
    kinds: Record<MaintenanceKind, string>;
    empty: string;
    openDocument: string;
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

const KIND_BG: Record<MaintenanceKind, string> = {
  service: "bg-primary text-white",
  repair: "bg-error/10 text-error",
  calibration: "bg-secondary text-white",
  inspection: "bg-warning/10 text-warning",
  warranty: "bg-primary-fixed text-primary",
};

export default function MaintenanceLogTable({
  records,
  labels,
  locale,
}: MaintenanceLogTableProps) {
  if (records.length === 0) {
    return (
      <div
        className="p-6 bg-surface-container-low text-sm text-on-surface-variant"
        style={{ borderRadius: "var(--radius-card)" }}
      >
        {labels.empty}
      </div>
    );
  }

  const columns = [
    { key: "date", label: labels.columns.date },
    { key: "kind", label: labels.columns.kind },
    { key: "title", label: labels.columns.title },
    { key: "technician", label: labels.columns.technician },
    { key: "document", label: labels.columns.document },
  ];

  const rows = records.map((r) => ({
    date: <span className="font-mono text-sm">{formatDate(r.date, locale)}</span>,
    kind: (
      <span
        className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 inline-block ${KIND_BG[r.kind]}`}
        style={{ borderRadius: "var(--radius-btn)" }}
      >
        {labels.kinds[r.kind]}
      </span>
    ),
    title: (
      <div className="flex flex-col">
        <span className="font-semibold text-on-surface">{r.title}</span>
        {r.notes ? (
          <span className="text-xs text-on-surface-variant leading-relaxed">
            {r.notes}
          </span>
        ) : null}
      </div>
    ),
    technician: r.technician ?? "—",
    document: r.documentId ? (
      <Link
        href={`/catalog/${r.documentId}`}
        className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
      >
        {labels.openDocument} ›
      </Link>
    ) : (
      "—"
    ),
  }));

  return <SpecTable columns={columns} rows={rows} />;
}
