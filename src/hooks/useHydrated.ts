"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns `false` during SSR and the first client (hydration) render, then
 * `true` for every render afterwards.
 *
 * Use this to gate client-only UI that would otherwise cause a hydration
 * mismatch. Unlike a `useState` + `useEffect(setMounted)` pattern it does not
 * trip `react-hooks/set-state-in-effect`, and — crucially — it stays correct
 * even when the component hydrates late (e.g. inside a `<Suspense>` boundary)
 * after some ancestor context has already flipped to its client value.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
