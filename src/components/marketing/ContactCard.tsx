import type { ReactNode } from "react";

export interface ContactLine {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}

interface ContactCardProps {
  title: string;
  address: {
    company: string;
    street: string;
    city: string;
  };
  lines: ContactLine[];
}

export default function ContactCard({
  title,
  address,
  lines,
}: ContactCardProps) {
  return (
    <div
      className="p-6 sm:p-8 bg-surface-container-lowest flex flex-col gap-5"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary">
        {title}
      </h2>
      <address className="not-italic text-sm text-on-surface leading-relaxed">
        <div className="font-bold text-on-surface">{address.company}</div>
        <div className="text-on-surface-variant">{address.street}</div>
        <div className="text-on-surface-variant">{address.city}</div>
      </address>
      <div className="flex flex-col gap-3">
        {lines.map((line) => {
          const labelBlock = (
            <div className="flex items-start gap-3">
              <span className="text-primary shrink-0 mt-0.5">{line.icon}</span>
              <span className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-[0.05em] text-on-surface-variant">
                  {line.label}
                </span>
                <span className="text-sm text-on-surface font-medium">
                  {line.value}
                </span>
              </span>
            </div>
          );
          if (line.href) {
            return (
              <a
                key={line.label}
                href={line.href}
                className="hover:underline text-on-surface"
              >
                {labelBlock}
              </a>
            );
          }
          return (
            <div key={line.label}>
              {labelBlock}
            </div>
          );
        })}
      </div>
    </div>
  );
}
