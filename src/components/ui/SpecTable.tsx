interface SpecTableColumn {
  key: string;
  label: string;
  className?: string;
}

interface SpecTableRow {
  [key: string]: React.ReactNode;
}

interface SpecTableProps {
  columns: SpecTableColumn[];
  rows: SpecTableRow[];
  /** Optional header bar above the table */
  header?: React.ReactNode;
  className?: string;
}

/**
 * High-density data table.
 * - 0px border radius (structural element)
 * - Zebra striping via surface / surface-container-low alternation
 * - Row hover transitions to primary-fixed (#d0e4ff)
 * - No dividers — tonal layering only
 */
export default function SpecTable({
  columns,
  rows,
  header,
  className = "",
}: SpecTableProps) {
  return (
    <div className={`overflow-hidden ${className}`} style={{ borderRadius: "var(--radius-table)" }}>
      {header && (
        <div className="bg-primary text-white px-3 py-2.5 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-surface-container-highest">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant ${col.className ?? ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className={`transition-colors hover:bg-primary-fixed ${
                  idx % 2 === 0
                    ? "bg-surface-container-lowest"
                    : "bg-surface-container-low"
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-3 text-sm text-on-surface ${col.className ?? ""}`}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
