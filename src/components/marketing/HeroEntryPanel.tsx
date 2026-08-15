import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export interface HeroEntryItem {
  icon: ReactNode;
  title: string;
  description: string;
  metric: string;
  href: string;
}

interface HeroEntryPanelProps {
  heading: string;
  items: HeroEntryItem[];
}

export default function HeroEntryPanel({ heading, items }: HeroEntryPanelProps) {
  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/60">
        <span aria-hidden className="inline-block h-1.5 w-1.5 bg-secondary" />
        {heading}
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group flex items-center gap-3 bg-white/10 px-3 py-3 transition-colors hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center text-primary-fixed"
                style={{ borderRadius: "var(--radius-btn)" }}
              >
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold leading-tight text-white">
                  {item.title}
                </span>
                <span className="block truncate text-xs leading-relaxed text-white/70">
                  {item.description}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-black leading-none text-white">
                  {item.metric}
                </span>
              </span>
              <ArrowRight
                size={16}
                aria-hidden
                className="shrink-0 text-white/60 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
