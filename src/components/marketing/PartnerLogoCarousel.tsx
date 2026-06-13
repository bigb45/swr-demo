"use client";

import Image from "next/image";
import { useRef } from "react";
import { Link } from "@/i18n/navigation";
import type { PartnerBrand } from "@/lib/partners";

interface PartnerLogoCarouselProps {
  heading: string;
  subheading: string;
  partners: PartnerBrand[];
  previousLabel: string;
  nextLabel: string;
}

export default function PartnerLogoCarousel({
  heading,
  subheading,
  partners,
  previousLabel,
  nextLabel,
}: PartnerLogoCarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: -1 | 1) {
    railRef.current?.scrollBy({
      left: direction * 280,
      behavior: "smooth",
    });
  }

  return (
    <section className="bg-surface-container-low py-14 sm:py-20">
      <div className="swr-page-shell flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-2">
              {heading}
            </p>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              {subheading}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label={previousLabel}
              className="h-10 w-10 inline-flex items-center justify-center bg-white text-primary hover:bg-primary hover:text-white transition-colors"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label={nextLabel}
              className="h-10 w-10 inline-flex items-center justify-center bg-white text-primary hover:bg-primary hover:text-white transition-colors"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        <div
          ref={railRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: "thin" }}
        >
          {partners.map((partner) => (
            <Link
              key={partner.slug}
              href={partner.productHref}
              aria-disabled="true"
              onClick={(e) => e.preventDefault()}
              className="group min-w-[180px] cursor-default bg-surface-container-lowest px-5 py-6 flex flex-col items-center justify-center gap-3 text-center"
              style={{ borderRadius: "var(--radius-card)" }}
            >
              {partner.logoSrc ? (
                <Image
                  src={partner.logoSrc}
                  alt={partner.name}
                  width={128}
                  height={56}
                  className="h-12 w-auto object-contain grayscale group-hover:grayscale-0 transition"
                />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center bg-primary text-white text-lg font-black tracking-[-0.04em] group-hover:bg-secondary" style={{ borderRadius: "var(--radius-btn)" }}>
                  {partner.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="text-sm font-bold uppercase tracking-[0.06em] text-primary">
                {partner.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
