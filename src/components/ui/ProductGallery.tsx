"use client";

import Image from "next/image";
import { useState } from "react";

interface GalleryImage {
  src: string;
  alt: string;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
  inStockLabel?: string;
}

/**
 * Product image gallery with main view + thumbnail strip.
 * Client component — manages active image state.
 * 5px radius on main image container, 0px on thumbnails.
 */
export default function ProductGallery({
  images,
  productName,
  inStockLabel,
}: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = images[activeIdx] ?? images[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div
        className="relative aspect-square bg-surface-container-lowest shadow-ambient overflow-hidden"
        style={{ borderRadius: "var(--radius-card)" }}
      >
        {active ? (
          <Image
            src={active.src}
            alt={active.alt || productName}
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-contain p-8"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-24 h-24 text-surface-container-highest"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* In-stock badge */}
        {inStockLabel && (
          <span
            className="absolute top-4 left-4 px-3 py-1 text-xs font-semibold bg-secondary text-white"
            style={{ borderRadius: "var(--radius-btn)" }}
          >
            {inStockLabel}
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`relative w-20 h-20 shrink-0 bg-surface-container-lowest overflow-hidden transition-all ${
                idx === activeIdx
                  ? "opacity-100"
                  : "opacity-60 hover:opacity-100"
              }`}
              style={{ borderRadius: "var(--radius-table)" }}
              aria-label={`View image ${idx + 1}`}
            >
              <Image
                src={img.src}
                alt={img.alt || `${productName} ${idx + 1}`}
                fill
                sizes="80px"
                className="object-contain p-2"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
