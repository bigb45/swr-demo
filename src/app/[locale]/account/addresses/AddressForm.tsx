"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { AddressInput } from "@/lib/address";

interface AddressFormProps {
  /** When set, the form is in "edit" mode and PUTs to /:id; otherwise POSTs. */
  addressId?: number;
  initial?: AddressInput;
  /** Where to send the user on success (e.g. /en/account/addresses). */
  redirectTo: string;
  /** Optional label for the cancel link target. */
  cancelHref: string;
}

const EMPTY: AddressInput = {
  firstname: "",
  lastname: "",
  company: "",
  street1: "",
  street2: "",
  city: "",
  postcode: "",
  countryId: "DE",
  region: "",
  telephone: "",
  defaultBilling: false,
  defaultShipping: false,
};

export default function AddressForm({
  addressId,
  initial,
  redirectTo,
  cancelHref,
}: AddressFormProps) {
  const t = useTranslations("addresses");
  const router = useRouter();
  const [form, setForm] = useState<AddressInput>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const url = addressId
        ? `/api/account/addresses/${addressId}`
        : "/api/account/addresses";
      const res = await fetch(url, {
        method: addressId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t("saveError"));
        return;
      }
      router.push(redirectTo);
      router.refresh();
    });
  }

  const inputClass =
    "w-full px-3 py-2.5 text-sm border border-outline-variant/60 rounded-(--radius-input) bg-surface focus:outline-none focus:border-primary text-on-surface";
  const labelClass =
    "text-xs font-semibold uppercase tracking-wide text-on-surface-variant";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="firstname">
            {t("firstname")}
          </label>
          <input
            id="firstname"
            required
            autoComplete="given-name"
            value={form.firstname}
            onChange={(e) => update("firstname", e.target.value)}
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
            value={form.lastname}
            onChange={(e) => update("lastname", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="company">
          {t("company")}
        </label>
        <input
          id="company"
          autoComplete="organization"
          value={form.company ?? ""}
          onChange={(e) => update("company", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="street1">
          {t("street1")}
        </label>
        <input
          id="street1"
          required
          autoComplete="address-line1"
          value={form.street1}
          onChange={(e) => update("street1", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="street2">
          {t("street2")}
        </label>
        <input
          id="street2"
          autoComplete="address-line2"
          value={form.street2 ?? ""}
          onChange={(e) => update("street2", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5 sm:col-span-1">
          <label className={labelClass} htmlFor="postcode">
            {t("postcode")}
          </label>
          <input
            id="postcode"
            required
            autoComplete="postal-code"
            value={form.postcode}
            onChange={(e) => update("postcode", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={labelClass} htmlFor="city">
            {t("city")}
          </label>
          <input
            id="city"
            required
            autoComplete="address-level2"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="region">
            {t("region")}
          </label>
          <input
            id="region"
            autoComplete="address-level1"
            value={form.region ?? ""}
            onChange={(e) => update("region", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="countryId">
            {t("country")}
          </label>
          <input
            id="countryId"
            required
            maxLength={2}
            autoComplete="country"
            value={form.countryId}
            onChange={(e) => update("countryId", e.target.value.toUpperCase())}
            className={inputClass}
          />
          <p className="text-[10px] text-on-surface-variant/60">
            {t("countryHint")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="telephone">
          {t("telephone")}
        </label>
        <input
          id="telephone"
          required
          type="tel"
          autoComplete="tel"
          value={form.telephone}
          onChange={(e) => update("telephone", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-outline-variant/30">
        <label className="flex items-center gap-2 text-sm text-on-surface">
          <input
            type="checkbox"
            checked={!!form.defaultBilling}
            onChange={(e) => update("defaultBilling", e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span>{t("defaultBilling")}</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-on-surface">
          <input
            type="checkbox"
            checked={!!form.defaultShipping}
            onChange={(e) => update("defaultShipping", e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span>{t("defaultShipping")}</span>
        </label>
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-600">{error}</p>
      )}

      <div className="flex items-center justify-end gap-3 mt-4">
        <a
          href={cancelHref}
          className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
        >
          {t("cancel")}
        </a>
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
