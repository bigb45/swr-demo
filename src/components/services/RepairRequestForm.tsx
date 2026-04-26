"use client";

import { useState } from "react";

interface RepairRequestFormProps {
  recipientEmail: string;
  labels: {
    heading: string;
    subheading: string;
    machineMake: string;
    machineModel: string;
    serial: string;
    fault: string;
    contactName: string;
    company: string;
    phone: string;
    email: string;
    submit: string;
    note: string;
  };
}

interface FormState {
  machineMake: string;
  machineModel: string;
  serial: string;
  fault: string;
  contactName: string;
  company: string;
  phone: string;
  email: string;
}

const EMPTY: FormState = {
  machineMake: "",
  machineModel: "",
  serial: "",
  fault: "",
  contactName: "",
  company: "",
  phone: "",
  email: "",
};

// Builds a mailto: link with an RFC-compliant body so customers can submit a
// repair request without us standing up a backend transport for this chunk.
// A Resend / SMTP integration is a separate ticket; this form's contract is
// intentionally compatible with one (just swap the submit handler).
function buildMailto(recipient: string, state: FormState, labels: RepairRequestFormProps["labels"]): string {
  const subject = `Repair request — ${state.machineMake} ${state.machineModel}`.trim();
  const lines = [
    `${labels.machineMake}: ${state.machineMake}`,
    `${labels.machineModel}: ${state.machineModel}`,
    `${labels.serial}: ${state.serial}`,
    "",
    `${labels.fault}:`,
    state.fault,
    "",
    `${labels.contactName}: ${state.contactName}`,
    `${labels.company}: ${state.company}`,
    `${labels.phone}: ${state.phone}`,
    `${labels.email}: ${state.email}`,
  ];
  const body = lines.join("\n");
  const params = new URLSearchParams({ subject, body });
  return `mailto:${recipient}?${params.toString().replace(/\+/g, "%20")}`;
}

export default function RepairRequestForm({
  recipientEmail,
  labels,
}: RepairRequestFormProps) {
  const [state, setState] = useState<FormState>(EMPTY);

  const update = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setState((prev) => ({ ...prev, [k]: e.target.value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = buildMailto(recipientEmail, state, labels);
  };

  const inputCls =
    "w-full px-4 py-3 text-sm bg-surface-container-lowest border border-outline-variant/40 focus:outline-none focus:border-primary";
  const inputStyle = { borderRadius: "var(--radius-btn)" } as const;

  return (
    <form
      onSubmit={onSubmit}
      className="bg-surface-container-low p-6 sm:p-8 flex flex-col gap-5"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      <header className="flex flex-col gap-1.5">
        <h3 className="text-xl font-black uppercase tracking-[-0.01em] text-primary">
          {labels.heading}
        </h3>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {labels.subheading}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {labels.machineMake}
          <input
            type="text"
            required
            value={state.machineMake}
            onChange={update("machineMake")}
            className={inputCls}
            style={inputStyle}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {labels.machineModel}
          <input
            type="text"
            required
            value={state.machineModel}
            onChange={update("machineModel")}
            className={inputCls}
            style={inputStyle}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {labels.serial}
        <input
          type="text"
          value={state.serial}
          onChange={update("serial")}
          className={inputCls}
          style={inputStyle}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {labels.fault}
        <textarea
          required
          rows={4}
          value={state.fault}
          onChange={update("fault")}
          className={inputCls}
          style={inputStyle}
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {labels.contactName}
          <input
            type="text"
            required
            value={state.contactName}
            onChange={update("contactName")}
            className={inputCls}
            style={inputStyle}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {labels.company}
          <input
            type="text"
            value={state.company}
            onChange={update("company")}
            className={inputCls}
            style={inputStyle}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {labels.phone}
          <input
            type="tel"
            required
            value={state.phone}
            onChange={update("phone")}
            className={inputCls}
            style={inputStyle}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {labels.email}
          <input
            type="email"
            required
            value={state.email}
            onChange={update("email")}
            className={inputCls}
            style={inputStyle}
          />
        </label>
      </div>

      <button
        type="submit"
        className="self-start inline-flex items-center gap-2 px-6 py-3 bg-secondary text-white text-sm font-bold uppercase tracking-[0.05em] hover:brightness-110"
        style={{ borderRadius: "var(--radius-btn)" }}
      >
        {labels.submit}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
      <p className="text-[11px] text-on-surface-variant">{labels.note}</p>
    </form>
  );
}
