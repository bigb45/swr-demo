"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError(t("loginError"));
        return;
      }

      router.push(from);
      router.refresh();
    });
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div
        className="w-full max-w-sm bg-surface-container-lowest p-8 rounded-card"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
        {/* Logo / heading */}
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            SWR Handelsgesellschaft
          </p>
          <h1 className="text-2xl font-black text-primary">
            {t("loginHeading")}
          </h1>
        </div>

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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {t("password")}
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {isPending ? t("loggingIn") : t("login")}
          </button>
        </form>

        <p className="mt-6 text-[11px] text-on-surface-variant/70 text-center leading-relaxed">
          {t("noAccount")}{" "}
          <Link
            href="/account/register"
            className="font-semibold text-secondary hover:underline"
          >
            {t("registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
