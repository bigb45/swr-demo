import type { ReactNode } from "react";

export interface FeatureItem {
  icon?: ReactNode;
  title: string;
  description: string;
}

interface FeatureGridProps {
  items: FeatureItem[];
  columns?: 2 | 3 | 4;
}

const COL_CLASS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export default function FeatureGrid({
  items,
  columns = 3,
}: FeatureGridProps) {
  return (
    <div className={`grid grid-cols-1 ${COL_CLASS[columns]} gap-4`}>
      {items.map((item) => (
        <div
          key={item.title}
          className="p-6 bg-surface-container-lowest flex flex-col gap-3"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          {item.icon ? (
            <div className="text-primary">{item.icon}</div>
          ) : null}
          <h3 className="text-sm font-black uppercase tracking-[0.05em] text-primary">
            {item.title}
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}
