import type { ReactNode } from "react";

interface WorkshopBlockProps {
  eyebrow?: string;
  heading: string;
  body: string;
  contactLines?: { label: string; value: string; href?: string }[];
  children?: ReactNode;
}

// Closing CTA block. More grounded than a saturated brand-blue panel — sits on
// a tonal cream so it reads as "real shop", not as another marketing splash.
export default function WorkshopBlock({
  eyebrow,
  heading,
  body,
  contactLines = [],
  children,
}: WorkshopBlockProps) {
  return (
    <section className="bg-surface-container-low py-14 sm:py-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-start">
        <div className="flex flex-col gap-4 max-w-2xl">
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-2xl sm:text-4xl font-black uppercase text-primary tracking-[-0.02em] leading-tight">
            {heading}
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            {body}
          </p>
          {children ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {children}
            </div>
          ) : null}
        </div>

        {contactLines.length > 0 ? (
          <dl
            className="bg-surface-container-lowest p-6 sm:p-8 flex flex-col gap-4"
            style={{
              borderRadius: "var(--radius-card)",
              boxShadow: "var(--shadow-ambient)",
            }}
          >
            {contactLines.map((line) => (
              <div
                key={line.label}
                className="flex flex-col gap-0.5 border-b border-outline-variant/30 pb-3 last:border-0 last:pb-0"
              >
                <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  {line.label}
                </dt>
                <dd className="text-base font-semibold text-primary">
                  {line.href ? (
                    <a href={line.href} className="hover:underline">
                      {line.value}
                    </a>
                  ) : (
                    line.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
