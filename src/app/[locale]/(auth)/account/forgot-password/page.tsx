"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t("forgotError"));
        return;
      }
      setSent(true);
    });
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div
        className="w-full max-w-sm bg-surface-container-lowest p-8 rounded-card"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            SWR Handelsgesellschaft
          </p>
          <h1 className="text-2xl font-black text-primary">
            {t("forgotHeading")}
          </h1>
          <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">
            {t("forgotDescription")}
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-on-surface text-center leading-relaxed">
              {t("forgotSent")}
            </p>
            <Link
              href="/account/login"
              className="text-xs font-semibold text-secondary hover:underline text-center"
            >
              {t("backToLogin")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                {t("email")}
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-outline-variant/60 rounded-(--radius-input) bg-surface focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-red-600 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full px-6 py-3 bg-secondary text-white font-bold text-sm uppercase tracking-wide hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-(--radius-btn)"
            >
              {isPending ? t("sending") : t("sendResetLink")}
            </button>

            <Link
              href="/account/login"
              className="text-[11px] font-semibold text-on-surface-variant hover:text-on-surface text-center mt-3"
            >
              {t("backToLogin")}
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
