"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface DeleteAddressButtonProps {
  addressId: number;
}

export default function DeleteAddressButton({
  addressId,
}: DeleteAddressButtonProps) {
  const t = useTranslations("addresses");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(t("deleteConfirm"))) return;

    startTransition(async () => {
      const res = await fetch(`/api/account/addresses/${addressId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? t("deleteError"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
    >
      {isPending ? t("deleting") : t("delete")}
    </button>
  );
}
