"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import type { MagentoProduct } from "@/types/magento";

interface AddToCartClusterProps {
  product: MagentoProduct;
  addToCartLabel: string;
  qtyLabel: string;
}

type Status = "idle" | "loading" | "success" | "error";

export default function AddToCartCluster({
  product,
  addToCartLabel,
  qtyLabel,
}: AddToCartClusterProps) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [inputVal, setInputVal] = useState("1");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputVal(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed) && parsed >= 1) setQty(parsed);
  }

  function handleBlur() {
    const clamped = Math.max(1, parseInt(inputVal, 10) || 1);
    setQty(clamped);
    setInputVal(String(clamped));
  }

  async function handleAddToCart() {
    setStatus("loading");
    setErrorMsg("");
    try {
      await addItem(product, qty);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch gap-0 h-[60px]">
        {/* QTY cluster */}
        <div
          className="flex items-center bg-surface-container-lowest border border-[rgba(193,199,209,0.3)] px-3 gap-2 shrink-0"
          style={{ borderRadius: "var(--radius-btn) 0 0 var(--radius-btn)" }}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            {qtyLabel}
          </span>
          <input
            type="number"
            min={1}
            value={inputVal}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            className="w-12 text-center text-sm font-medium bg-transparent border-0 border-b-2 border-b-outline-variant focus:border-b-primary focus:outline-none py-1 text-on-surface disabled:opacity-50"
            aria-label={qtyLabel}
          />
        </div>

        {/* Add to Cart button */}
        <button
          onClick={handleAddToCart}
          disabled={isLoading}
          className={`flex-1 flex items-center justify-center gap-3 text-white font-bold text-base transition-all disabled:cursor-not-allowed ${
            isSuccess
              ? "bg-green-600"
              : "bg-secondary hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
          }`}
          style={{ borderRadius: "0 var(--radius-btn) var(--radius-btn) 0" }}
        >
          {isLoading ? (
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : isSuccess ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          )}
          {isLoading ? "" : isSuccess ? "Added!" : addToCartLabel}
        </button>
      </div>

      {status === "error" && (
        <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
      )}
    </div>
  );
}
