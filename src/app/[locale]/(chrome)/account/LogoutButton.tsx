"use client";

import { useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import { useCart } from "@/components/CartProvider";
import { useWatchlist } from "@/components/WatchlistProvider";

interface LogoutButtonProps {
  label: string;
  className?: string;
  /** Kept for callers that previously passed dashboardTile — rendered as inline. */
  variant?: "inline" | "dashboardTile";
  tagline?: string;
}

export default function LogoutButton({
  label,
  className = "",
}: LogoutButtonProps) {
  const router = useRouter();
  const { clearCart } = useCart();
  const { clear: clearWatchlist } = useWatchlist();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      clearCart();
      clearWatchlist();
      router.push("/account/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className={
        "text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:underline disabled:opacity-50 " +
        className
      }
    >
      {label}
    </button>
  );
}
