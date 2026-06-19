import type { ReactNode } from "react";

interface HeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function Hero({
  eyebrow,
  title,
  subtitle,
  children,
}: HeroProps) {
  return (
    <section
      className="relative overflow-hidden py-14 sm:py-20"
      style={{
        background: "linear-gradient(160deg, #003a63 0%, #005288 100%)",
      }}
    >
      <div className="swr-page-shell relative z-10">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/70 mb-3">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-[-0.02em] uppercase">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 sm:mt-6 max-w-2xl text-sm sm:text-base text-white/80 leading-relaxed">
            {subtitle}
          </p>
        ) : null}
        {children ? (
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
