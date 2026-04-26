interface TimelineStep {
  index: number;
  title: string;
  body: string;
}

interface RepairTimelineProps {
  steps: TimelineStep[];
  callout?: { value: string; label: string };
}

export default function RepairTimeline({ steps, callout }: RepairTimelineProps) {
  return (
    <div className="flex flex-col gap-6">
      {callout ? (
        <div
          className="inline-flex items-center gap-3 self-start px-5 py-3 bg-primary text-white"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <span className="text-2xl font-black tabular-nums">
            {callout.value}
          </span>
          <span className="text-xs uppercase tracking-[0.12em] font-bold text-white/80">
            {callout.label}
          </span>
        </div>
      ) : null}
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, idx) => (
          <li
            key={step.index}
            className="relative flex flex-col gap-3 p-5 bg-surface-container-lowest"
            style={{
              borderRadius: "var(--radius-card)",
              boxShadow: "var(--shadow-ambient)",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center justify-center w-9 h-9 bg-secondary text-white font-black text-base tabular-nums"
                style={{ borderRadius: "999px" }}
              >
                {step.index}
              </span>
              {idx < steps.length - 1 ? (
                <span className="hidden sm:block flex-1 h-px bg-outline-variant/40" />
              ) : null}
            </div>
            <h4 className="text-base font-black uppercase tracking-[-0.01em] text-primary">
              {step.title}
            </h4>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
