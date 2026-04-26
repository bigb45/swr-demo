"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { MagentoCustomerAddress } from "@/types/magento";
import type { AddressInput } from "@/lib/address";
import type { Country } from "@/lib/directory";
import CountryRegionFields from "@/components/CountryRegionFields";
import { selectAddressAction } from "./actions";

interface AddressStepProps {
  locale: string;
  addresses: MagentoCustomerAddress[];
  defaultAddressId?: number;
  countries: Country[];
}

const EMPTY_ADDRESS: AddressInput = {
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

export default function AddressStep({
  locale,
  addresses,
  defaultAddressId,
  countries,
}: AddressStepProps) {
  const t = useTranslations("checkout");
  const tAddr = useTranslations("addresses");

  const initialMode: "saved" | "new" = addresses.length > 0 ? "saved" : "new";
  const [mode, setMode] = useState<"saved" | "new">(initialMode);
  const [selectedId, setSelectedId] = useState<number | undefined>(
    defaultAddressId ?? addresses[0]?.id,
  );
  const [newAddr, setNewAddr] = useState<AddressInput>(EMPTY_ADDRESS);
  const [saveToBook, setSaveToBook] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setNewAddr((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await selectAddressAction({
        locale,
        mode,
        addressId: mode === "saved" ? selectedId : undefined,
        newAddress: mode === "new" ? newAddr : undefined,
        saveToBook: mode === "new" ? saveToBook : false,
      });
      // selectAddressAction redirects on success; only error responses return.
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  const inputClass =
    "w-full px-3 py-2.5 text-sm border border-outline-variant/60 rounded-(--radius-input) bg-surface focus:outline-none focus:border-primary text-on-surface";
  const labelClass =
    "text-xs font-semibold uppercase tracking-wide text-on-surface-variant";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {addresses.length > 0 && (
        <section
          className="bg-surface-container-lowest rounded-card p-6"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wide">
              {t("savedAddresses")}
            </h2>
            <button
              type="button"
              onClick={() => setMode("new")}
              className="text-xs font-semibold text-secondary hover:underline"
            >
              {t("addNewAddress")}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addresses.map((a) => {
              const checked = mode === "saved" && selectedId === a.id;
              return (
                <label
                  key={a.id}
                  className={`flex gap-3 p-4 rounded border cursor-pointer transition-colors ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 hover:border-outline-variant"
                  }`}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    value={a.id}
                    checked={checked}
                    onChange={() => {
                      setMode("saved");
                      setSelectedId(a.id);
                    }}
                    className="mt-1 accent-primary"
                  />
                  <div className="text-xs text-on-surface">
                    {a.company && (
                      <p className="font-bold text-primary">{a.company}</p>
                    )}
                    <p className="font-semibold">
                      {a.firstname} {a.lastname}
                    </p>
                    <p className="text-on-surface-variant">
                      {a.street.join(", ")}
                    </p>
                    <p className="text-on-surface-variant">
                      {a.postcode} {a.city}
                    </p>
                    <p className="text-on-surface-variant">{a.country_id}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {mode === "new" && (
        <section
          className="bg-surface-container-lowest rounded-card p-6"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wide">
              {t("newAddress")}
            </h2>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setMode("saved")}
                className="text-xs font-semibold text-on-surface-variant hover:text-on-surface"
              >
                {t("useSavedAddress")}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="firstname">
                {tAddr("firstname")}
              </label>
              <input
                id="firstname"
                required={mode === "new"}
                autoComplete="given-name"
                value={newAddr.firstname}
                onChange={(e) => update("firstname", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="lastname">
                {tAddr("lastname")}
              </label>
              <input
                id="lastname"
                required={mode === "new"}
                autoComplete="family-name"
                value={newAddr.lastname}
                onChange={(e) => update("lastname", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-4">
            <label className={labelClass} htmlFor="company">
              {tAddr("company")}
            </label>
            <input
              id="company"
              autoComplete="organization"
              value={newAddr.company ?? ""}
              onChange={(e) => update("company", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5 mt-4">
            <label className={labelClass} htmlFor="street1">
              {tAddr("street1")}
            </label>
            <input
              id="street1"
              required={mode === "new"}
              autoComplete="address-line1"
              value={newAddr.street1}
              onChange={(e) => update("street1", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5 mt-4">
            <label className={labelClass} htmlFor="street2">
              {tAddr("street2")}
            </label>
            <input
              id="street2"
              autoComplete="address-line2"
              value={newAddr.street2 ?? ""}
              onChange={(e) => update("street2", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="postcode">
                {tAddr("postcode")}
              </label>
              <input
                id="postcode"
                required={mode === "new"}
                autoComplete="postal-code"
                inputMode="text"
                value={newAddr.postcode}
                onChange={(e) => update("postcode", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className={labelClass} htmlFor="city">
                {tAddr("city")}
              </label>
              <input
                id="city"
                required={mode === "new"}
                autoComplete="address-level2"
                value={newAddr.city}
                onChange={(e) => update("city", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <CountryRegionFields
              countries={countries}
              countryId={newAddr.countryId}
              region={newAddr.region ?? ""}
              onCountryChange={(code) => update("countryId", code)}
              onRegionChange={(r) => update("region", r)}
              required={mode === "new"}
              labels={{
                country: tAddr("country"),
                region: tAddr("region"),
                regionOptional: tAddr("regionOptional"),
              }}
              countryHint={tAddr("countryHint")}
            />
          </div>

          <div className="flex flex-col gap-1.5 mt-4">
            <label className={labelClass} htmlFor="telephone">
              {tAddr("telephone")}
            </label>
            <input
              id="telephone"
              required={mode === "new"}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={newAddr.telephone}
              onChange={(e) => update("telephone", e.target.value)}
              className={inputClass}
            />
          </div>

          <label className="flex items-center gap-2 mt-5 text-sm">
            <input
              type="checkbox"
              checked={saveToBook}
              onChange={(e) => setSaveToBook(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span>{t("saveToAddressBook")}</span>
          </label>
        </section>
      )}

      {error && (
        <p className="text-xs font-semibold text-red-600">{error}</p>
      )}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 bg-secondary text-white font-bold text-sm tracking-wide hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-(--radius-btn)"
        >
          {isPending ? t("loading") : t("continueToShipping")}
        </button>
      </div>
    </form>
  );
}
