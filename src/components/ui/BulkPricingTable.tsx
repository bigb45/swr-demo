interface BulkPricingRow {
  quantityLabel: string;
  priceLabel: string;
  savingsLabel?: string;
}

interface BulkPricingTableProps {
  rows: BulkPricingRow[];
  headers: {
    quantity: string;
    pricePerUnit: string;
    savings: string;
  };
}

/**
 * Quantity-tiered pricing table for the PDP purchase panel.
 * 0px radius (structural data element), zebra striping.
 */
export default function BulkPricingTable({
  rows,
  headers,
}: BulkPricingTableProps) {
  return (
    <div className="overflow-hidden" style={{ borderRadius: "var(--radius-table)" }}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-primary text-white">
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.05em]">
              {headers.quantity}
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.05em]">
              {headers.pricePerUnit}
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.05em]">
              {headers.savings}
            </th>
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
              <td className="px-4 py-2 text-sm text-on-surface">
                {row.quantityLabel}
              </td>
              <td className="px-4 py-2 text-sm font-medium text-on-surface">
                {row.priceLabel}
              </td>
              <td className="px-4 py-2 text-sm">
                {row.savingsLabel ? (
                  <span className="font-semibold text-secondary">
                    {row.savingsLabel}
                  </span>
                ) : (
                  <span className="text-on-surface-variant">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
