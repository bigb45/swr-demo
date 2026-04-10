"use client";

import { useTranslations } from "next-intl";
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

  return (
    <nav className="flex items-center justify-center gap-1 mt-12">
      {currentPage > 1 && (
        <Link
          href={`${baseUrl}?page=${currentPage - 1}`}
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
              <span className="px-2 py-2 text-sm text-gray-400">…</span>
            )}
            <Link
              href={`${baseUrl}?page=${page}`}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                page === currentPage
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {t("next")}
        </Link>
      )}
    </nav>
  );
}
