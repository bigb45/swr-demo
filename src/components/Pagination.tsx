"use client";

import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  baseUrl: string;
}

export default function Pagination({
  currentPage,
  totalCount,
  pageSize,
  baseUrl,
}: PaginationProps) {
  const t = useTranslations("pagination");
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2
  );
  const pageLinkClass =
    "inline-flex min-h-9 min-w-9 items-center justify-center px-3 py-2 text-sm font-semibold rounded-(--radius-btn) transition-colors";
  const inactivePageClass =
    "bg-surface-container-low text-primary hover:bg-surface-container-highest hover:text-primary-container";
  const activePageClass = "bg-primary text-on-primary";

  return (
    <nav className="flex items-center justify-center gap-1 mt-12">
      {currentPage > 1 && (
        <Link
          href={`${baseUrl}?page=${currentPage - 1}`}
          className={`${pageLinkClass} ${inactivePageClass}`}
        >
          {t("prev")}
        </Link>
      )}

      {visiblePages.map((page, idx) => {
        const prev = visiblePages[idx - 1];
        const showEllipsis = prev && page - prev > 1;
        return (
          <span key={page} className="flex items-center gap-1">
            {showEllipsis && (
              <span className="px-2 py-2 text-sm text-on-surface-variant">
                …
              </span>
            )}
            <Link
              href={`${baseUrl}?page=${page}`}
              className={`${pageLinkClass} ${
                page === currentPage ? activePageClass : inactivePageClass
              }`}
            >
              {page}
            </Link>
          </span>
        );
      })}

      {currentPage < totalPages && (
        <Link
          href={`${baseUrl}?page=${currentPage + 1}`}
          className={`${pageLinkClass} ${inactivePageClass}`}
        >
          {t("next")}
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
