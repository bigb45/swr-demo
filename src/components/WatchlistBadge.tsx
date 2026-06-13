"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { useWatchlist } from "./WatchlistProvider";

export default function WatchlistBadge() {
  const { ready, count } = useWatchlist();
  const hydrated = useHydrated();

  if (!hydrated || !ready || count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}
