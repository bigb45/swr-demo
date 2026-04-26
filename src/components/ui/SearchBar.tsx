"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

interface SearchBarProps {
  locale: string;
  compact?: boolean;
}

export default function SearchBar({ compact = false }: SearchBarProps) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-stretch w-full"
      role="search"
    >
      <div className="relative flex-1">
        {/* Search icon */}
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className={`w-full bg-surface-container-highest border-0 border-b-2 border-b-outline-variant focus:border-b-primary focus:outline-none pl-10 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant transition-colors ${compact ? "py-1.5" : "py-2"}`}
          style={{ borderRadius: "var(--radius-input) var(--radius-input) 0 0" }}
        />
      </div>
      <button
        type="submit"
        aria-label={t("search")}
        className={`bg-secondary text-white text-sm font-bold tracking-wide hover:brightness-110 transition-all shrink-0 inline-flex items-center justify-center ${compact ? "px-3 py-1.5 min-w-10" : "px-3 sm:px-5 py-2 min-w-10 sm:min-w-[92px]"}`}
        style={{ borderRadius: "0 var(--radius-btn) var(--radius-btn) 0" }}
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
          aria-hidden="true"
          className="sm:hidden"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="hidden sm:inline">{t("search")}</span>
      </button>
    </form>
  );
}
