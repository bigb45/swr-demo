import Image from "next/image";
import {
  SHOP_CATEGORY_ICON_SRC,
  type ShopCategoryIcon as ShopCategoryIconName,
} from "@/lib/shop-categories";

interface ShopCategoryIconProps {
  icon: ShopCategoryIconName;
  className?: string;
}

function FallbackIcon({ className = "h-6 w-6" }: { className?: string }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  return (
    <svg {...common}>
      <path d="M4 7l8-4 8 4-8 4z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 17l8 4 8-4" />
    </svg>
  );
}

export default function ShopCategoryIcon({
  icon,
  className = "h-6 w-6",
}: ShopCategoryIconProps) {
  const src = SHOP_CATEGORY_ICON_SRC[icon];

  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={48}
        height={48}
        className={`${className} object-contain`}
        aria-hidden
      />
    );
  }

  if (icon === "catalog") {
    const common = {
      width: 24,
      height: 24,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.5,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      className,
      "aria-hidden": true,
    };

    return (
      <svg {...common}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 1 4 16.5z" />
        <path d="M8 7h8" />
        <path d="M8 11h6" />
      </svg>
    );
  }

  return <FallbackIcon className={className} />;
}
