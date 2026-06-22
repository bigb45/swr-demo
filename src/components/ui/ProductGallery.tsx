"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import type { StockLevel } from "@/lib/stock";
import StockBadge from "./StockBadge";
import NoImagePlaceholder from "./NoImagePlaceholder";

interface GalleryImage {
  src: string;
  alt: string;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
  /**
   * When set, renders a coloured stock chip as an overlay in the top-left of
   * the main image. Omit (or pass "unknown") to hide the chip entirely.
   */
  stockLevel?: StockLevel;
  stockLabel?: string;
}

/**
 * Product image gallery with main view + thumbnail strip.
 * Client component — manages active image state.
 * Supports left/right chevron navigation and touch swipe on mobile.
 */
export default function ProductGallery({
  images,
  productName,
  stockLevel,
  stockLabel,
}: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = images[activeIdx] ?? images[0];
  const touchStartX = useRef<number | null>(null);

  const prev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setActiveIdx((i) => (i + 1) % images.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      delta < 0 ? next() : prev();
    }
    touchStartX.current = null;
  };

  const showNav = images.length > 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div
        className="relative aspect-square bg-surface-container-lowest shadow-ambient overflow-hidden"
        style={{ borderRadius: "var(--radius-card)" }}
        onTouchStart={showNav ? handleTouchStart : undefined}
        onTouchEnd={showNav ? handleTouchEnd : undefined}
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
          <NoImagePlaceholder variant="gallery" />
        )}

        {/* Stock chip */}
        {stockLevel && stockLevel !== "unknown" && stockLabel && (
          <StockBadge
            level={stockLevel}
            label={stockLabel}
            variant="chip"
            size="md"
            className="absolute top-4 left-4"
          />
        )}

        {/* Chevron navigation — only when multiple images */}
        {showNav && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-(--radius-btn) bg-primary text-white shadow-ambient hover:bg-primary/90 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-(--radius-btn) bg-primary text-white shadow-ambient hover:bg-primary/90 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 flex max-w-[calc(100%-2rem)] -translate-x-1/2 gap-1.5 overflow-x-auto rounded-full bg-surface-container-lowest/90 px-2 py-1 shadow-ambient">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  aria-label={`Go to image ${idx + 1}`}
                  className={
                    idx === activeIdx
                      ? "h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      : "h-1.5 w-1.5 shrink-0 rounded-full bg-outline-variant hover:bg-on-surface-variant/60"
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`relative box-content w-20 h-20 shrink-0 bg-surface-container-lowest overflow-hidden transition-all ${
                idx === activeIdx
                  ? "opacity-100 bg-surface-container-highest"
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
                className="box-content object-contain p-2 border-0"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
