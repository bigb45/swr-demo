interface PageHeaderLightProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function PageHeaderLight({
  eyebrow,
  title,
  subtitle,
  className = "mb-8 max-w-3xl",
}: PageHeaderLightProps) {
  return (
    <div className={className}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-secondary mb-3">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl sm:text-5xl font-black uppercase text-primary tracking-[-0.02em] leading-tight">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-4 sm:mt-6 text-sm sm:text-base text-on-surface-variant leading-relaxed">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
