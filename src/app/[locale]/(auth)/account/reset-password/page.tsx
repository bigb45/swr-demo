"use client";

import { useState, useTransition, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";

/**
 * Magento's reset email builds links as
 *   /customer/account/createPassword?id=XYZ&token=ABC
 * …but on this storefront we surface them as
 *   /{locale}/account/reset-password?email=x@y.z&token=ABC
 * (email is echoed so the user doesn't have to retype it).
 */
function ResetPasswordInner() {
  const t = useTranslations("auth");
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") ?? "";
  const emailParam = search.get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }
    if (!token) {
      setError(t("resetTokenMissing"));
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetToken: token, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t("resetError"));
        return;
      }
      router.push("/account/login?reset=1");
    });
  }

  return (
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
          {t("newPassword")}
        </label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
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
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-outline-variant/60 rounded-(--radius-input) bg-surface focus:outline-none focus:border-primary text-on-surface"
        />
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-600 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full px-6 py-3 bg-secondary text-white font-bold text-sm uppercase tracking-wide hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-(--radius-btn)"
      >
        {isPending ? t("saving") : t("setNewPassword")}
      </button>

      <Link
        href="/account/login"
        className="text-[11px] font-semibold text-on-surface-variant hover:text-on-surface text-center mt-3"
      >
        {t("backToLogin")}
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("auth");

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
            {t("resetHeading")}
          </h1>
        </div>

        <Suspense fallback={null}>
          <ResetPasswordInner />
        </Suspense>
      </div>
    </div>
  );
}
