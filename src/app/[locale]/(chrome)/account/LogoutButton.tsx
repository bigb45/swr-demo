"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface LogoutButtonProps {
  label: string;
  /** Optional subtitle (e.g. TEIA “END SESSION” tile). */
  tagline?: string;
  className?: string;
  /** TEIA account overview: full dashboard tile with power icon. */
  variant?: "inline" | "dashboardTile";
}

export default function LogoutButton({
  label,
  tagline,
  className = "",
  variant = "inline",
}: LogoutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/account/login");
      router.refresh();
    });
  }

  if (variant === "dashboardTile") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        className={
          "flex min-h-40 w-full flex-col justify-between border-b-2 border-b-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-surface-container-low px-6 pb-6 pt-6 text-left transition-[border-color,box-shadow] hover:border-b-primary hover:shadow-ambient disabled:opacity-50 " +
          className
        }
      >
        <div className="flex w-full items-start">
          <svg
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-on-surface-variant"
            aria-hidden
          >
            <path d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-lg font-bold leading-7 tracking-tight text-on-surface-variant">
            {label}
          </span>
          {tagline ? (
            <span className="text-xs font-normal uppercase leading-4 tracking-[0.05em] text-on-surface-variant/70">
              {tagline}
            </span>
          ) : null}
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className={
        "flex w-full items-center gap-4 bg-surface-container-lowest p-6 text-left transition-shadow rounded-card hover:shadow-ambient disabled:opacity-50 " +
        className
      }
      style={{ boxShadow: "var(--shadow-ambient)" }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-on-surface-variant"
        aria-hidden
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span className="text-sm font-bold text-on-surface-variant">{label}</span>
    </button>
  );
}
