import type { ReactNode } from "react";

interface HeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  /** Optional visual rendered in a right-hand column on large screens. */
  media?: ReactNode;
}

export default function Hero({
  eyebrow,
  title,
  subtitle,
  children,
  media,
}: HeroProps) {
  return (
    <section className="swr-grain relative isolate overflow-hidden bg-primary text-white">
      {/* Layered brand background: deep-blue ramp, blueprint grid, two soft glows. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(152deg, #00284a 0%, #003a63 46%, #00497e 100%)",
        }}
      />
      <div aria-hidden className="swr-blueprint absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="absolute -right-24 -top-28 -z-10 h-104 w-104 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(0,110,33,0.28), transparent 68%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-28 -z-10 h-120 w-120 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(32,98,152,0.45), transparent 70%)",
        }}
      />

      <div className="swr-page-shell relative z-10 py-16 sm:py-24">
        <div
          className={
            media
              ? "grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]"
              : ""
          }
        >
          <div className="max-w-2xl">
            {eyebrow ? (
              <p className="swr-hero-in inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-fixed">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 bg-secondary"
                />
                {eyebrow}
              </p>
            ) : null}
            <h1 className="swr-hero-in swr-hero-in-1 mt-4 text-balance text-3xl font-black uppercase leading-[1.05] tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="swr-hero-in swr-hero-in-2 mt-5 max-w-xl text-pretty text-sm leading-relaxed text-white/80 sm:text-lg">
                {subtitle}
              </p>
            ) : null}
            {children ? (
              <div className="swr-hero-in swr-hero-in-3 mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                {children}
              </div>
            ) : null}
          </div>

          {media ? (
            <div className="swr-hero-in swr-hero-in-2 relative hidden lg:block">
              {media}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
