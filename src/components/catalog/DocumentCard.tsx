import { Link } from "@/i18n/navigation";
import type { CatalogDocument } from "@/lib/catalog";
import PdfThumbnail from "./PdfThumbnail";

interface DocumentCardProps {
  doc: CatalogDocument;
  typeLabel: string;
  pageLabel?: string;
  languageLabel: string;
}

export default function DocumentCard({
  doc,
  typeLabel,
  pageLabel,
  languageLabel,
}: DocumentCardProps) {
  return (
    <Link
      href={`/catalog/${doc.id}`}
      className="group flex min-h-64 flex-col gap-4 p-4 bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      <PdfThumbnail doc={doc} size="lg" />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-secondary">
          {typeLabel}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.08em] text-on-surface-variant px-1.5 py-0.5 bg-surface-container-low"
          style={{ borderRadius: "3px" }}
        >
          {languageLabel}
        </span>
      </div>
      <h3 className="text-sm font-bold text-primary leading-snug line-clamp-3">
        {doc.title}
      </h3>
      <div className="flex items-center justify-between text-[11px] text-on-surface-variant mt-auto pt-2 border-t border-outline-variant/30">
        <span className="font-semibold uppercase tracking-wider">
          {doc.brand}
        </span>
        {doc.pageCount && pageLabel ? <span>{pageLabel}</span> : null}
      </div>
    </Link>
  );
}
