import { Link } from "@/i18n/navigation";
import type { CatalogDocument } from "@/lib/catalog";
import PdfThumbnail from "@/components/catalog/PdfThumbnail";

interface CatalogPreviewRailProps {
  heading: string;
  subheading?: string;
  documents: CatalogDocument[];
  viewAllLabel: string;
  viewAllHref?: string;
  emptyLabel?: string;
}

export default function CatalogPreviewRail({
  heading,
  subheading,
  documents,
  viewAllLabel,
  viewAllHref = "/catalog",
  emptyLabel,
}: CatalogPreviewRailProps) {
  return (
    <section className="py-12 sm:py-16">
      <div className="swr-page-shell">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-primary tracking-[-0.02em]">
              {heading}
            </h2>
            {subheading ? (
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                {subheading}
              </p>
            ) : null}
          </div>
          <Link
            href={viewAllHref}
            className="text-xs font-bold uppercase tracking-[0.08em] text-primary hover:underline inline-flex items-center gap-1.5 shrink-0"
          >
            {viewAllLabel}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            {emptyLabel ?? ""}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/catalog/${doc.id}`}
                className="group flex flex-col gap-2"
              >
                <PdfThumbnail doc={doc} size="md" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                  {doc.brand}
                </span>
                <span className="text-xs text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
                  {doc.title}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
