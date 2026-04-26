"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface ProfileFormProps {
  initial: {
    firstname: string;
    lastname: string;
    email: string;
  };
  redirectTo: string;
}

export default function ProfileForm({ initial, redirectTo }: ProfileFormProps) {
  const t = useTranslations("account");
  const router = useRouter();

  const [firstname, setFirstname] = useState(initial.firstname);
  const [lastname, setLastname] = useState(initial.lastname);
  const [email, setEmail] = useState(initial.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const emailChanged = email.trim().toLowerCase() !== initial.email.toLowerCase();
  const wantsPwChange = newPassword.length > 0 || confirmPassword.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (wantsPwChange && newPassword !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    if ((emailChanged || wantsPwChange) && !currentPassword) {
      setError(t("currentPasswordRequired"));
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname,
          lastname,
          email,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t("profileSaveError"));
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    });
  }

  const inputClass =
    "w-full px-3 py-2.5 text-sm border border-outline-variant/60 rounded-(--radius-input) bg-surface focus:outline-none focus:border-primary text-on-surface";
  const labelClass =
    "text-xs font-semibold uppercase tracking-wide text-on-surface-variant";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="firstname">
            {t("firstname")}
          </label>
          <input
            id="firstname"
            required
            autoComplete="given-name"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="lastname">
            {t("lastname")}
          </label>
          <input
            id="lastname"
            required
            autoComplete="family-name"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="email">
          {t("email")}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="pt-4 border-t border-outline-variant/30 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold text-primary uppercase tracking-wide">
            {t("changePassword")}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {t("changePasswordHint")}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="currentPassword">
            {t("currentPassword")}
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="newPassword">
              {t("newPassword")}
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="confirmPassword">
              {t("confirmPassword")}
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      {success && (
        <p className="text-xs font-semibold text-success">
          {t("profileSaved")}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link
          href={redirectTo}
          className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
        >
          {t("cancel")}
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-secondary text-white font-bold text-sm tracking-wide hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-(--radius-btn)"
        >
          {isPending ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
