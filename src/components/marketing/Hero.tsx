import type { ReactNode } from "react";

interface HeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  variant?: "default" | "compact";
}

export default function Hero({
  eyebrow,
  title,
  subtitle,
  children,
  variant = "default",
}: HeroProps) {
  const padClass = variant === "compact" ? "py-10 sm:py-14" : "py-14 sm:py-20";
  return (
    <section
      className={`relative overflow-hidden ${padClass}`}
      style={{
        background: "linear-gradient(160deg, #003a63 0%, #005288 100%)",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/70 mb-3">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={`font-black text-white tracking-[-0.02em] uppercase ${
            variant === "compact"
              ? "text-2xl sm:text-4xl"
              : "text-3xl sm:text-5xl"
          }`}
        >
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
