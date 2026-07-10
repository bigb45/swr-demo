"use client";

import { useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import ShopCategoryIcon from "./shop/ShopCategoryIcon";
import { useShopCategories } from "@/lib/useShopCategories";

interface ShopMegaMenuProps {
  label: string;
  href: "/shop";
  allLabel: string;
  heading: string;
}

export default function ShopMegaMenu({
  label,
  href,
  allLabel,
  heading,
}: ShopMegaMenuProps) {
  const [open, setOpen] = useState(false);
  // Once the menu has been opened once we start (and keep) loading categories.
  const [primed, setPrimed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { categories, loading } = useShopCategories(primed);

  const reveal = () => {
    setOpen(true);
    setPrimed(true);
  };

  return (
    <div
      ref={rootRef}
      className="relative h-full flex items-center"
      onMouseEnter={reveal}
      onMouseLeave={() => setOpen(false)}
      onFocus={reveal}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <Link
        href={href}
        className="h-full inline-flex items-center text-sm font-semibold uppercase tracking-[0.04em] text-on-surface hover:text-primary transition-colors whitespace-nowrap"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
      </Link>

      <div
        className={`absolute left-0 top-full w-[min(760px,calc(100vw-3rem))] bg-white p-5 transition ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
        style={{ boxShadow: "0 10px 30px rgba(26,28,28,0.06)", borderRadius: "0 0 var(--radius-card) var(--radius-card)" }}
        role="menu"
        aria-label={heading}
      >
        <div className="grid grid-cols-2 gap-2">
          {loading && categories.length === 0
            ? Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-surface-container-lowest px-3 py-3"
                  style={{ borderRadius: "var(--radius-btn)" }}
                  aria-hidden="true"
                >
                  <span className="h-9 w-9 animate-pulse bg-surface-container-highest" style={{ borderRadius: "var(--radius-btn)" }} />
                  <span className="h-3 w-28 animate-pulse bg-surface-container-highest" style={{ borderRadius: "var(--radius-btn)" }} />
                </div>
              ))
            : categories.map((category) => (
                <Link
                  key={category.id}
                  href={category.href}
                  className="group flex items-center gap-3 bg-surface-container-lowest px-3 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
                  style={{ borderRadius: "var(--radius-btn)" }}
                  role="menuitem"
                >
                  <span className="flex h-9 w-9 items-center justify-center bg-white p-1" style={{ borderRadius: "var(--radius-btn)" }}>
                    <ShopCategoryIcon icon={category.icon} className="h-7 w-7" />
                  </span>
                  {category.name}
                </Link>
              ))}
        </div>
        <Link
          href={href}
          className="mt-3 flex items-center justify-between bg-primary px-4 py-3 text-sm font-bold uppercase tracking-[0.05em] text-white hover:bg-secondary transition-colors"
          style={{ borderRadius: "var(--radius-btn)" }}
          role="menuitem"
        >
          {allLabel}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
