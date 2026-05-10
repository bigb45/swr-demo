export interface RealityItem {
  value: string;
  label: string;
  sublabel?: string;
}

interface RealityStripProps {
  heading?: string;
  items: RealityItem[];
}

export default function RealityStrip({ heading, items }: RealityStripProps) {
  return (
    <section
      className="bg-primary text-white py-10 sm:py-14"
      aria-label={heading}
    >
      <div className="swr-page-shell">
        {heading ? (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60 mb-6">
            {heading}
          </p>
        ) : null}
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <dd className="text-3xl sm:text-4xl font-black tracking-[-0.02em] tabular-nums">
                {item.value}
              </dd>
              <dt className="text-sm font-semibold text-white/90">
                {item.label}
              </dt>
              {item.sublabel ? (
                <p className="text-xs text-white/60 leading-relaxed">
                  {item.sublabel}
                </p>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
