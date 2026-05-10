"use client";

import dynamic from "next/dynamic";

const CartContent = dynamic(() => import("./CartContent"), { ssr: false });

export default function CartPageClient() {
  return <CartContent />;
}
