import type { ReactNode } from "react";

interface IndustryHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function IndustryHero({
  eyebrow,
  title,
  subtitle,
  children,
}: IndustryHeroProps) {
  return (
    <section
      className="relative overflow-hidden py-12 sm:py-16 border-b border-outline-variant/30"
      style={{
        background: "linear-gradient(160deg, #f9f9f9 0%, #ffffff 100%)",
      }}
    >
      <div className="swr-page-shell">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-secondary mb-3">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl sm:text-5xl font-black text-primary tracking-[-0.02em] uppercase">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-sm sm:text-base text-on-surface-variant leading-relaxed">
            {subtitle}
          </p>
        ) : null}
        {children ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
