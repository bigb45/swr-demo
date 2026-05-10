"use client";

import { type ReactNode, useState, useSyncExternalStore } from "react";

const LG_MQ = "(min-width: 1024px)";

function subscribeLg(onChange: () => void) {
  const mq = window.matchMedia(LG_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getLgClient() {
  return window.matchMedia(LG_MQ).matches;
}

function getLgServer() {
  return false;
}

const band = "var(--catalog-sticky-band-estimate)";

const ASIDE_STICKY_TOP = `calc(var(--swr-header-offset) + ${band})`;

interface CatalogFacetColumnProps {
  sidebarTitle: string;
  sidebarSubtitle: string;
  mobileShowFilters: string;
  mobileHideFilters: string;
  filtersPanelLabel: string;
  children: ReactNode;
}

export default function CatalogFacetColumn({
  sidebarTitle,
  sidebarSubtitle,
  mobileShowFilters,
  mobileHideFilters,
  filtersPanelLabel,
  children,
}: CatalogFacetColumnProps) {
  const isLg = useSyncExternalStore(subscribeLg, getLgClient, getLgServer);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <aside
      className="sticky z-20 w-full shrink-0 self-start bg-surface-container-lowest lg:w-[260px] lg:shrink-0 lg:overflow-y-auto lg:overscroll-y-contain"
      style={{
        top: ASIDE_STICKY_TOP,
        maxHeight: "var(--catalog-pane-max-height)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-ambient)",
      }}
      aria-label={filtersPanelLabel}
    >
      {isLg ? (
        <div className="p-4 sm:p-5">{children}</div>
      ) : (
        <>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            aria-expanded={mobileOpen}
            aria-controls="catalog-facet-panel"
            id="catalog-facet-trigger"
            aria-label={mobileOpen ? mobileHideFilters : mobileShowFilters}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="min-w-0 flex flex-col gap-1">
              <span className="text-sm font-bold text-primary leading-snug">
                {sidebarTitle}
              </span>
              <span className="text-xs text-on-surface-variant leading-snug line-clamp-2">
                {sidebarSubtitle}
              </span>
            </span>
            <span className="shrink-0 text-lg leading-none text-primary" aria-hidden>
              {mobileOpen ? "▲" : "▼"}
            </span>
          </button>
          <div
            id="catalog-facet-panel"
            role="region"
            aria-labelledby="catalog-facet-trigger"
            aria-hidden={!mobileOpen}
            className={
              mobileOpen
                ? "max-h-[min(52dvh,22rem)] overflow-y-auto overscroll-y-contain border-t border-outline-variant/40 px-4 pb-4 pt-3"
                : "hidden"
            }
          >
            {children}
          </div>
        </>
      )}
    </aside>
  );
}
