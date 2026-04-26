"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";

interface LogoutButtonProps {
  label: string;
  className?: string;
  /** Called after the cookie is cleared (e.g. to close a mobile drawer). */
  onLoggedOut?: () => void;
}

/**
 * POSTs to /api/auth/logout to drop the `swr_customer_token` cookie, then
 * forces a router refresh so the server-rendered Header re-evaluates the
 * authenticated state on the next paint.
 */
export default function LogoutButton({
  label,
  className,
  onLoggedOut,
}: LogoutButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Cookie deletion is local — even on network failure the user can retry.
    } finally {
      onLoggedOut?.();
      startTransition(() => {
        router.replace("/");
        router.refresh();
      });
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={submitting || pending}
      className={className}
    >
      {label}
    </button>
  );
}
