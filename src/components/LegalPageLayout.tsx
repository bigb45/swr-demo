import type { ReactNode } from "react";

interface LegalPageLayoutProps {
  title: string;
  intro?: string;
  children: ReactNode;
  contact?: string;
}

export default function LegalPageLayout({
  title,
  intro,
  children,
  contact,
}: LegalPageLayoutProps) {
  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-8 py-12">
      <h1 className="text-3xl font-black text-primary mb-2">{title}</h1>
      {intro ? (
        <p className="text-sm text-on-surface-variant mb-10 leading-relaxed">
          {intro}
        </p>
      ) : null}
      {children}
      {contact ? (
        <p className="mt-12 text-xs text-on-surface-variant/70 border-t border-outline-variant/30 pt-6">
          {contact}
        </p>
      ) : null}
    </div>
  );
}
