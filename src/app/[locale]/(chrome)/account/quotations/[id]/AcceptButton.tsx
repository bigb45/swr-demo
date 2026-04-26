"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { acceptQuotationAction } from "./actions";
import type { AcceptQuotationResult } from "@/lib/quotations";

interface AcceptButtonProps {
  quotationId: string;
  disabled?: boolean;
}

export default function AcceptButton({ quotationId, disabled }: AcceptButtonProps) {
  const t = useTranslations("quotations");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AcceptQuotationResult | null>(null);

  function handleAccept() {
    startTransition(async () => {
      const res = await acceptQuotationAction(quotationId);
      setResult(res);
      if (res.success) {
        router.push("/cart");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleAccept}
        disabled={disabled || isPending}
        className="px-6 py-3 bg-secondary text-white text-sm font-bold uppercase tracking-wide hover:brightness-110 transition-all rounded-(--radius-btn) disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? t("accepting") : t("acceptToCart")}
      </button>
      {result && !result.success ? (
        <p className="text-xs text-red-600">
          {t(`acceptError.${result.code}`)}
          {result.unavailable_skus && result.unavailable_skus.length > 0 ? (
            <span className="ml-1 font-mono">
              ({result.unavailable_skus.join(", ")})
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
