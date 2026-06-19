"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { Link } from "@/i18n/navigation";

type AccountType = "business" | "private";

const COUNTRIES: { code: string; label: string }[] = [
  { code: "DE", label: "Deutschland" },
  { code: "CH", label: "Schweiz" },
  { code: "AT", label: "Österreich" },
  { code: "FR", label: "France" },
  { code: "IT", label: "Italia" },
  { code: "NL", label: "Nederland" },
  { code: "BE", label: "Belgique / België" },
  { code: "LU", label: "Luxembourg" },
  { code: "PL", label: "Polska" },
  { code: "CZ", label: "Česko" },
  { code: "DK", label: "Danmark" },
  { code: "SE", label: "Sverige" },
  { code: "ES", label: "España" },
  { code: "GB", label: "United Kingdom" },
];

const inputClass =
  "w-full px-3 py-2.5 text-sm border border-outline-variant/60 rounded-(--radius-input) bg-surface focus:outline-none focus:border-primary text-on-surface";
const labelClass =
  "text-xs font-semibold uppercase tracking-wide text-on-surface-variant";

export default function RegisterPage() {
  const t = useTranslations("auth");

  const [step, setStep] = useState(1);
  const stepRef = useRef<HTMLDivElement>(null);

  const [accountType, setAccountType] = useState<AccountType>("business");
  const [salutation, setSalutation] = useState("company");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [vatId, setVatId] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("DE");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isBusiness = accountType === "business";

  const steps = [
    { n: 1, label: t("step1Label") },
    { n: 2, label: t("step2Label") },
  ];

  /** Validate the currently mounted step's native constraints. */
  function currentStepValid(): boolean {
    const node = stepRef.current;
    if (!node) return true;
    const controls = node.querySelectorAll<
      HTMLInputElement | HTMLSelectElement
    >("input, select");
    for (const control of controls) {
      if (!control.checkValidity()) {
        control.reportValidity();
        return false;
      }
    }
    return true;
  }

  function goNext() {
    setError(null);
    if (currentStepValid()) setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Enter key / premature submit on step 1 advances instead of submitting.
    if (step === 1) {
      goNext();
      return;
    }

    setError(null);

    if (!currentStepValid()) return;
    if (email !== emailConfirm) {
      setError(t("emailMismatch"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    if (!privacy) {
      setError(t("privacyRequired"));
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType,
          salutation,
          firstName,
          lastName,
          company: isBusiness ? company : "",
          vatId: isBusiness ? vatId : "",
          street,
          houseNumber,
          postcode,
          city,
          country,
          phone,
          email,
          password,
        }),
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
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
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
            aria-hidden
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
            className="inline-flex items-center justify-center gap-1 text-sm font-bold text-secondary hover:underline"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 sm:py-16">
      <div
        className="w-full max-w-xl bg-surface-container-lowest p-6 sm:p-10 rounded-card"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">
            SWR GmbH
          </p>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-primary tracking-[-0.01em]">
            {t("registerHeading")}
          </h1>
          <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
            {t("registerIntro")}
          </p>
        </div>

        {/* Numbered stepper */}
        <ol className="mb-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => {
            const isActive = step === s.n;
            const isDone = step > s.n;
            return (
              <li key={s.n} className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-primary text-on-primary"
                      : isDone
                        ? "bg-secondary text-on-secondary"
                        : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {s.n}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-wide ${
                    isActive ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="mx-1 h-px w-6 bg-outline-variant/60"
                  />
                )}
              </li>
            );
          })}
        </ol>

        <p className="mb-6 text-center text-[11px] text-on-surface-variant/70">
          {t("requiredNote")}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {step === 1 ? (
            <div ref={stepRef} className="flex flex-col gap-8">
              {/* Account type */}
              <fieldset className="flex flex-col gap-3">
                <legend className="text-xs font-black uppercase tracking-widest text-primary mb-3">
                  {t("accountTypeSection")}
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  {(["business", "private"] as AccountType[]).map((type) => {
                    const active = accountType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAccountType(type)}
                        aria-pressed={active}
                        className={`px-4 py-3 text-sm font-bold uppercase tracking-wide rounded-(--radius-btn) transition-colors ${
                          active
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        {type === "business"
                          ? t("businessCustomer")
                          : t("privateCustomer")}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Personal */}
              <fieldset className="flex flex-col gap-4">
                <legend className="text-xs font-black uppercase tracking-widest text-primary mb-3">
                  {t("personalSection")}
                </legend>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} htmlFor="salutation">
                    {t("salutation")}
                  </label>
                  <select
                    id="salutation"
                    value={salutation}
                    onChange={(e) => setSalutation(e.target.value)}
                    className={inputClass}
                  >
                    <option value="company">{t("salutationCompany")}</option>
                    <option value="mr">{t("salutationMr")}</option>
                    <option value="mrs">{t("salutationMrs")}</option>
                    <option value="none">{t("salutationNone")}</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="firstName">
                      {t("firstName")} *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="lastName">
                      {t("lastName")} *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </fieldset>

              {/* Company (business only) */}
              {isBusiness && (
                <fieldset className="flex flex-col gap-4">
                  <legend className="text-xs font-black uppercase tracking-widest text-primary mb-3">
                    {t("companySection")}
                  </legend>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="company">
                      {t("company")} *
                    </label>
                    <input
                      id="company"
                      type="text"
                      required={isBusiness}
                      autoComplete="organization"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="vatId">
                      {t("vatId")}
                      <span className="ml-1 lowercase font-normal text-on-surface-variant/60">
                        ({t("vatIdHint")})
                      </span>
                    </label>
                    <input
                      id="vatId"
                      type="text"
                      value={vatId}
                      onChange={(e) => setVatId(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </fieldset>
              )}

              {/* Address */}
              <fieldset className="flex flex-col gap-4">
                <legend className="text-xs font-black uppercase tracking-widest text-primary mb-3">
                  {t("addressSection")}
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="street">
                      {t("street")} *
                    </label>
                    <input
                      id="street"
                      type="text"
                      required
                      autoComplete="address-line1"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="houseNumber">
                      {t("houseNumber")} *
                    </label>
                    <input
                      id="houseNumber"
                      type="text"
                      required
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="postcode">
                      {t("postcode")} *
                    </label>
                    <input
                      id="postcode"
                      type="text"
                      required
                      autoComplete="postal-code"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="city">
                      {t("city")} *
                    </label>
                    <input
                      id="city"
                      type="text"
                      required
                      autoComplete="address-level2"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} htmlFor="country">
                    {t("country")} *
                  </label>
                  <select
                    id="country"
                    required
                    autoComplete="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={inputClass}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>
            </div>
          ) : (
            <div ref={stepRef} className="flex flex-col gap-8">
              {/* Contact */}
              <fieldset className="flex flex-col gap-4">
                <legend className="text-xs font-black uppercase tracking-widest text-primary mb-3">
                  {t("contactSection")}
                </legend>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} htmlFor="phone">
                    {t("phone")} *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="email">
                      {t("email")} *
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
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="emailConfirm">
                      {t("emailConfirm")} *
                    </label>
                    <input
                      id="emailConfirm"
                      type="email"
                      required
                      autoComplete="email"
                      value={emailConfirm}
                      onChange={(e) => setEmailConfirm(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </fieldset>

              {/* Password */}
              <fieldset className="flex flex-col gap-4">
                <legend className="text-xs font-black uppercase tracking-widest text-primary mb-3">
                  {t("securitySection")}
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="password">
                      {t("password")} *
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={
                          showPassword ? t("hidePassword") : t("showPassword")
                        }
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant hover:text-primary"
                      >
                        {showPassword ? (
                          <EyeOff aria-hidden className="h-4 w-4" />
                        ) : (
                          <Eye aria-hidden className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor="confirmPassword">
                      {t("confirmPassword")} *
                    </label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </fieldset>

              {/* Consent */}
              <div className="flex items-start gap-3">
                <input
                  id="privacy"
                  type="checkbox"
                  checked={privacy}
                  onChange={(e) => setPrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-secondary"
                />
                <label
                  htmlFor="privacy"
                  className="text-xs text-on-surface-variant leading-relaxed"
                >
                  {t("privacyConsentPrefix")}
                  <Link
                    href="/legal/privacy"
                    className="font-semibold text-secondary hover:underline"
                  >
                    {t("privacyConsentLink")}
                  </Link>
                  {t("privacyConsentSuffix")}
                </label>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-red-600">{error}</p>
          )}

          {/* Footer nav */}
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                className="flex items-center justify-center gap-1 px-5 py-3 text-sm font-bold uppercase tracking-wide text-primary bg-surface-container-low hover:bg-surface-container-high transition-colors rounded-(--radius-btn)"
              >
                <ChevronLeft aria-hidden className="h-4 w-4" />
                {t("back")}
              </button>
            )}
            {step === 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-white font-bold text-sm uppercase tracking-wide hover:brightness-110 transition-all rounded-(--radius-btn)"
              >
                {t("continue")}
                <ChevronRight aria-hidden className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-white font-bold text-sm uppercase tracking-wide hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-(--radius-btn)"
              >
                {isPending ? t("registering") : t("register")}
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center">
          <Link
            href="/account/login"
            className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-secondary hover:underline"
          >
            <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
