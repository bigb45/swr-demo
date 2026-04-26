import type { CatalogDocument } from "@/lib/catalog";
import { Link } from "@/i18n/navigation";

interface PdfViewerProps {
  doc: CatalogDocument;
  labels: {
    download: string;
    openInNewTab: string;
    backToList: string;
    viewerNotice: string;
    externalNotice: string;
    externalCta: string;
  };
}

/**
 * Returns true when `pdfUrl` lives on our own origin (relative path or
 * protocol-relative path). Cross-origin PDFs are NOT iframed because:
 *   1. Most vendor sites send `X-Frame-Options: SAMEORIGIN` /
 *      `Content-Security-Policy: frame-ancestors`, so the iframe is blocked
 *      by the browser and the user sees a `chrome-error://` page.
 *   2. The PDF could 404 or move at any time and we have no control over it.
 *   3. Embedding a third-party page leaks the visitor's IP to the vendor.
 * For external URLs we render a download/open card instead.
 */
function isSameOriginUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  return false;
}

// We rely on the browser's native PDF viewer (rendered inside an <iframe>) to
// handle paging, zoom, and in-document search — but ONLY for PDFs we host
// ourselves. A custom toolbar above the iframe gives the user the SWR
// shell-level actions that the native viewer does not always expose
// consistently across browsers.
export default function PdfViewer({ doc, labels }: PdfViewerProps) {
  const sameOrigin = isSameOriginUrl(doc.pdfUrl);
  return (
    <div className="flex flex-col w-full">
      <div
        className="flex flex-wrap items-center gap-2 px-3 py-2 bg-primary text-white"
        style={{ borderTopLeftRadius: "var(--radius-card)", borderTopRightRadius: "var(--radius-card)" }}
      >
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white/80 hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {labels.backToList}
        </Link>
        <span className="hidden sm:block w-px h-4 bg-white/30 mx-2" />
        <span className="text-xs sm:text-sm font-bold truncate flex-1 min-w-0">
          {doc.title}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <a
            href={doc.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 sm:py-1.5 text-[11px] font-bold uppercase tracking-[0.05em] bg-white/10 hover:bg-white/20 transition-colors min-h-11 sm:min-h-0"
            style={{ borderRadius: "3px" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {labels.openInNewTab}
          </a>
          <a
            href={doc.pdfUrl}
            download
            className="inline-flex items-center gap-1.5 px-3 py-2.5 sm:py-1.5 text-[11px] font-bold uppercase tracking-[0.05em] bg-secondary hover:brightness-110 transition-all min-h-11 sm:min-h-0"
            style={{ borderRadius: "3px" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {labels.download}
          </a>
        </div>
      </div>
      {sameOrigin ? (
        <iframe
          src={doc.pdfUrl}
          title={doc.title}
          className="w-full h-[70vh] sm:h-[80vh] bg-surface-container-low border-0"
          style={{
            borderBottomLeftRadius: "var(--radius-card)",
            borderBottomRightRadius: "var(--radius-card)",
          }}
        />
      ) : (
        <div
          className="w-full h-[70vh] sm:h-[80vh] bg-surface-container-low flex flex-col items-center justify-center gap-5 p-8 text-center"
          style={{
            borderBottomLeftRadius: "var(--radius-card)",
            borderBottomRightRadius: "var(--radius-card)",
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-on-surface-variant"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p className="max-w-md text-sm text-on-surface-variant leading-relaxed">
            {labels.externalNotice}
          </p>
          <a
            href={doc.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-secondary hover:brightness-110 transition-all"
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {labels.externalCta}
          </a>
        </div>
      )}
      <p className="mt-2 text-[11px] text-on-surface-variant">
        {labels.viewerNotice}
      </p>
    </div>
  );
}
