"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/toast";

interface DeleteAddressButtonProps {
  addressId: number;
}

export default function DeleteAddressButton({
  addressId,
}: DeleteAddressButtonProps) {
  const t = useTranslations("addresses");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/account/addresses/${addressId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        notify.error(t("deleteError"));
        setConfirming(false);
        return;
      }
      notify.success(t("deleteSuccess"));
      setConfirming(false);
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label={t("deleteConfirm")}
      >
        <span className="text-xs text-on-surface-variant">
          {t("deleteConfirm")}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs font-semibold text-error hover:underline disabled:opacity-50"
        >
          {isPending ? t("deleting") : t("deleteConfirmYes")}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="text-xs font-semibold text-on-surface-variant hover:underline disabled:opacity-50"
        >
          {t("deleteConfirmNo")}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs font-semibold text-error hover:underline"
    >
      {t("delete")}
    </button>
  );
}
