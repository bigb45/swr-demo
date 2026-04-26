"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

interface CatalogSearchProps {
  placeholder: string;
  ariaLabel: string;
}

export default function CatalogSearch({
  placeholder,
  ariaLabel,
}: CatalogSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const submit = (raw: string) => {
    const next = new URLSearchParams(Array.from(searchParams.entries()));
    const trimmed = raw.trim();
    if (trimmed) {
      next.set("q", trimmed);
    } else {
      next.delete("q");
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    });
  };

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
      className="flex items-stretch w-full"
      style={{ borderRadius: "var(--radius-btn)", overflow: "hidden" }}
    >
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="flex-1 px-4 py-3 text-sm bg-surface-container-lowest border border-outline-variant/40 focus:outline-none focus:border-primary"
        style={{ borderTopLeftRadius: "var(--radius-btn)", borderBottomLeftRadius: "var(--radius-btn)" }}
      />
      <button
        type="submit"
        aria-label={ariaLabel}
        className="px-5 py-3 text-sm font-bold text-white bg-primary hover:brightness-110 transition-all disabled:opacity-60"
        style={{ borderTopRightRadius: "var(--radius-btn)", borderBottomRightRadius: "var(--radius-btn)" }}
        disabled={isPending}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </form>
  );
}
