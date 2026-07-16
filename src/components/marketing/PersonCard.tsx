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
      className="flex flex-col items-stretch gap-4 bg-surface-container-lowest p-5 sm:flex-row sm:gap-5 sm:p-6"
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
            className="h-20 w-20 object-cover sm:h-24 sm:w-24"
            style={{ borderRadius: "var(--radius-card)" }}
          />
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center bg-primary text-xl font-black text-white sm:h-24 sm:w-24"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            {initials}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <p className="text-xs font-semibold text-secondary">{role}</p>
        <h3 className="text-lg font-bold tracking-tight text-primary sm:text-xl">
          {name}
        </h3>
        {quote ? (
          <p className="text-sm leading-relaxed text-on-surface-variant">
            &ldquo;{quote}&rdquo;
          </p>
        ) : null}
        <div className="mt-1.5 flex flex-col gap-1.5 text-sm sm:flex-row sm:gap-4">
          {phone ? (
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="font-semibold text-primary hover:underline"
            >
              {phone}
            </a>
          ) : null}
          {email ? (
            <a
              href={`mailto:${email}`}
              className="font-semibold text-primary hover:underline"
            >
              {email}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
