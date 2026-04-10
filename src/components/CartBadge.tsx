"use client";

import { useState, useEffect } from "react";
import { useCart } from "./CartProvider";

export default function CartBadge() {
  const { itemCount } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || itemCount === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
      {itemCount > 99 ? "99+" : itemCount}
    </span>
  );
}
