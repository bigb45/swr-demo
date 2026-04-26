"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function RegisterPage() {
  const t = useTranslations("auth");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? t("registerError"));
        return;
      }

      setSuccess(true);
    });
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div
          className="w-full max-w-sm bg-surface-container-lowest p-8 rounded-card text-center"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-4 text-primary"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h2 className="text-xl font-black text-primary mb-2">
            {t("registerSuccess")}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
            {t("registerPending")}
          </p>
          <Link
            href="/account/login"
            className="inline-block text-sm font-bold text-secondary hover:underline"
          >
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    );
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
            {t("registerHeading")}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                {t("firstName")}
              </label>
              <input
                type="text"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-outline-variant/60 rounded-(--radius-input) bg-surface focus:outline-none focus:border-primary text-on-surface"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                {t("lastName")}
              </label>
              <input
                type="text"
                required
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-outline-variant/60 rounded-(--radius-input) bg-surface focus:outline-none focus:border-primary text-on-surface"
              />
            </div>
          </div>

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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {t("password")}
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-outline-variant/60 rounded-(--radius-input) bg-surface focus:outline-none focus:border-primary text-on-surface"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {t("confirmPassword")}
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-white font-bold text-sm uppercase tracking-wide hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-(--radius-btn)"
          >
            {isPending ? t("registering") : t("register")}
          </button>
        </form>

        <p className="mt-6 text-[11px] text-on-surface-variant/70 text-center leading-relaxed">
          <Link
            href="/account/login"
            className="font-semibold text-secondary hover:underline"
          >
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
