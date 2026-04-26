import type { CatalogDocument } from "@/lib/catalog";

interface PdfThumbnailProps {
  doc: Pick<CatalogDocument, "title" | "brand" | "type" | "thumbnailUrl">;
  size?: "sm" | "md" | "lg";
}

// Manufacturer PDFs do not ship pre-rendered cover thumbnails in the metadata
// feed, so until we wire up a server-side renderer we generate a brand-coloured
// placeholder cover that still reads as a real document at a glance.
const TYPE_LABELS: Record<string, string> = {
  catalog: "CATALOG",
  "price-list": "PRICE LIST",
  datasheet: "DATASHEET",
  manual: "MANUAL",
  certificate: "CERTIFICATE",
  sds: "SDS",
  instructions: "INSTRUCTIONS",
  "technical-info": "TECH INFO",
  performance: "DOP",
  presentation: "BROCHURE",
  video: "VIDEO",
  misc: "DOCUMENT",
};

function brandHue(brand: string): string {
  let hash = 0;
  for (let i = 0; i < brand.length; i += 1) {
    hash = (hash * 31 + brand.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 18%, 24%)`;
}

export default function PdfThumbnail({ doc, size = "md" }: PdfThumbnailProps) {
  const sizeClass =
    size === "sm" ? "h-24" : size === "lg" ? "h-64" : "h-44";
  if (doc.thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={doc.thumbnailUrl}
        alt={doc.title}
        className={`w-full ${sizeClass} object-cover`}
        style={{ borderRadius: "3px" }}
      />
    );
  }
  return (
    <div
      className={`w-full ${sizeClass} flex flex-col items-center justify-center text-white p-3`}
      style={{
        backgroundColor: brandHue(doc.brand),
        borderRadius: "3px",
      }}
    >
      <span className="text-[10px] font-bold tracking-[0.2em] opacity-70 uppercase">
        {TYPE_LABELS[doc.type] ?? doc.type.toUpperCase()}
      </span>
      <span className="mt-2 text-base font-black uppercase tracking-tight text-center leading-tight">
        {doc.brand}
      </span>
      <span className="mt-1 text-[10px] opacity-70 uppercase tracking-wider text-center line-clamp-2">
        {doc.title}
      </span>
    </div>
  );
}
