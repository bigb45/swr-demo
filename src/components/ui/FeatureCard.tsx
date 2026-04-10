interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

/**
 * Feature highlight card used in the PDP "Engineered for the Jobsite" grid.
 * 5px radius, ambient shadow, tonal layering.
 */
export default function FeatureCard({
  icon,
  title,
  description,
  className = "",
}: FeatureCardProps) {
  return (
    <div
      className={`bg-surface-container-lowest p-6 flex flex-col gap-4 shadow-ambient ${className}`}
      style={{ borderRadius: "var(--radius-card)" }}
    >
      <span className="text-secondary">{icon}</span>
      <h4 className="text-sm font-bold text-primary tracking-tight">
        {title}
      </h4>
      <p className="text-sm text-on-surface-variant leading-relaxed">
        {description}
      </p>
    </div>
  );
}
