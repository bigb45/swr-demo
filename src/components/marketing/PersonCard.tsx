interface PersonCardProps {
  name: string;
  role: string;
  phone?: string;
  email?: string;
  quote?: string;
  imageUrl?: string;
}

export default function PersonCard({
  name,
  role,
  phone,
  email,
  quote,
  imageUrl,
}: PersonCardProps) {
  const initials = name
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
  return (
    <div
      className="flex flex-col sm:flex-row gap-6 items-stretch p-6 sm:p-8 bg-surface-container-lowest"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      <div className="shrink-0">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="w-24 h-24 sm:w-28 sm:h-28 object-cover"
            style={{ borderRadius: "var(--radius-card)" }}
          />
        ) : (
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center bg-primary text-white text-2xl font-black"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            {initials}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-secondary">
          {role}
        </p>
        <h3 className="text-xl font-black text-primary tracking-[-0.01em]">
          {name}
        </h3>
        {quote ? (
          <p className="text-sm text-on-surface-variant leading-relaxed italic">
            &ldquo;{quote}&rdquo;
          </p>
        ) : null}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-5 mt-2 text-sm">
          {phone ? (
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="text-primary hover:underline font-semibold"
            >
              {phone}
            </a>
          ) : null}
          {email ? (
            <a
              href={`mailto:${email}`}
              className="text-primary hover:underline font-semibold"
            >
              {email}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
