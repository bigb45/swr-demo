import type { ReactNode } from "react";

export interface TrustItem {
  icon?: ReactNode;
  label: string;
  sublabel?: string;
}

interface TrustStripProps {
  items: TrustItem[];
}

export default function TrustStrip({ items }: TrustStripProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-6 p-6 bg-surface-container-low"
      style={{ borderRadius: "var(--radius-card)" }}
    >
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3 min-w-0">
          {item.icon ? (
            <div className="text-primary shrink-0">{item.icon}</div>
          ) : null}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold uppercase tracking-[0.05em] text-primary truncate">
              {item.label}
            </span>
            {item.sublabel ? (
              <span className="text-xs text-on-surface-variant truncate">
                {item.sublabel}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
