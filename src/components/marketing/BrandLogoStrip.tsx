export interface BrandLogo {
  name: string;
  src?: string;
  href?: string;
}

interface BrandLogoStripProps {
  heading?: string;
  logos: BrandLogo[];
}

export default function BrandLogoStrip({
  heading,
  logos,
}: BrandLogoStripProps) {
  return (
    <section className="flex flex-col gap-4">
      {heading ? (
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          {heading}
        </h2>
      ) : null}
      <div
        className="flex flex-wrap items-center justify-start gap-6 sm:gap-10 p-6 bg-surface-container-lowest"
        style={{ borderRadius: "var(--radius-card)" }}
      >
        {logos.map((logo) => {
          const content = logo.src ? (
            // Plain <img> is fine here: supplier logos are external assets.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo.src}
              alt={logo.name}
              className="h-8 sm:h-10 w-auto max-w-[140px] object-contain grayscale hover:grayscale-0 transition"
            />
          ) : (
            <span className="text-sm sm:text-base font-bold tracking-wide text-on-surface-variant uppercase">
              {logo.name}
            </span>
          );
          if (logo.href) {
            return (
              <a
                key={logo.name}
                href={logo.href}
                target="_blank"
                rel="noreferrer noopener"
                className="shrink-0"
                aria-label={logo.name}
              >
                {content}
              </a>
            );
          }
          return (
            <div key={logo.name} className="shrink-0">
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
