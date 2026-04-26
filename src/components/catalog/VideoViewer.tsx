import type { CatalogDocument } from "@/lib/catalog";
import { Link } from "@/i18n/navigation";

interface VideoViewerProps {
  doc: CatalogDocument;
  labels: {
    backToList: string;
    openInNewTab: string;
    watchOnYoutube: string;
    videoNotice: string;
    unsupportedVideo: string;
    unsupportedVideoCta: string;
  };
}

// Any YouTube URL shape we know how to embed gets normalized to an 11-char
// video id. We never blindly drop unknown URLs into the iframe because that
// leaks visitor data to third parties the vendor has not approved.
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const kind = parts[0];
      const id = parts[1];
      if (
        (kind === "embed" || kind === "shorts" || kind === "live") &&
        id &&
        /^[\w-]{11}$/.test(id)
      ) {
        return id;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function isFileVideoUrl(url: string): boolean {
  if (!url) return false;
  // Treat same-origin paths as trusted file videos. Extension check is a
  // convenience so we do not try to <video> an arbitrary same-origin URL.
  if (!(url.startsWith("/") && !url.startsWith("//"))) return false;
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(url);
}

function mimeForUrl(url: string): string | undefined {
  const m = url.toLowerCase().match(/\.([a-z0-9]+)(?:\?|#|$)/);
  if (!m) return undefined;
  switch (m[1]) {
    case "mp4":
    case "m4v":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "ogg":
    case "ogv":
      return "video/ogg";
    case "mov":
      return "video/quicktime";
    default:
      return undefined;
  }
}

export default function VideoViewer({ doc, labels }: VideoViewerProps) {
  const rawUrl = doc.videoUrl ?? doc.pdfUrl;
  const explicitProvider = doc.videoProvider;

  const youtubeId =
    explicitProvider === "file" ? null : extractYouTubeId(rawUrl);
  const isFile =
    explicitProvider === "file" ||
    (explicitProvider !== "youtube" && !youtubeId && isFileVideoUrl(rawUrl));

  // Canonical "open externally" URL — for YouTube we always point at the
  // standard watch page (more familiar than the embed URL).
  const externalUrl = youtubeId
    ? `https://www.youtube.com/watch?v=${youtubeId}`
    : rawUrl;
  const externalLabel = youtubeId ? labels.watchOnYoutube : labels.openInNewTab;

  return (
    <div className="flex flex-col w-full">
      <div
        className="flex flex-wrap items-center gap-2 px-3 py-2 bg-primary text-white"
        style={{
          borderTopLeftRadius: "var(--radius-card)",
          borderTopRightRadius: "var(--radius-card)",
        }}
      >
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white/80 hover:text-white"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 sm:py-1.5 text-[11px] font-bold uppercase tracking-[0.05em] bg-white/10 hover:bg-white/20 transition-colors min-h-11 sm:min-h-0"
            style={{ borderRadius: "3px" }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {externalLabel}
          </a>
        </div>
      </div>

      {youtubeId ? (
        <div
          className="relative w-full bg-black"
          style={{
            aspectRatio: "16 / 9",
            borderBottomLeftRadius: "var(--radius-card)",
            borderBottomRightRadius: "var(--radius-card)",
            overflow: "hidden",
          }}
        >
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            title={doc.title}
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : isFile ? (
        <div
          className="relative w-full bg-black"
          style={{
            aspectRatio: "16 / 9",
            borderBottomLeftRadius: "var(--radius-card)",
            borderBottomRightRadius: "var(--radius-card)",
            overflow: "hidden",
          }}
        >
          <video
            src={rawUrl}
            poster={doc.posterUrl}
            controls
            preload="metadata"
            className="absolute inset-0 w-full h-full"
          >
            {mimeForUrl(rawUrl) ? (
              <source src={rawUrl} type={mimeForUrl(rawUrl)} />
            ) : null}
          </video>
        </div>
      ) : (
        <div
          className="w-full h-[60vh] sm:h-[70vh] bg-surface-container-low flex flex-col items-center justify-center gap-5 p-8 text-center"
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
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <p className="max-w-md text-sm text-on-surface-variant leading-relaxed">
            {labels.unsupportedVideo}
          </p>
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-secondary hover:brightness-110 transition-all"
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {labels.unsupportedVideoCta}
          </a>
        </div>
      )}

      <p className="mt-2 text-[11px] text-on-surface-variant">
        {labels.videoNotice}
      </p>
    </div>
  );
}
