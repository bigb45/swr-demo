import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

type ButtonAsButton = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: "button";
    href?: never;
  };

type ButtonAsAnchor = ButtonBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: "a";
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-secondary text-white hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]",
  ghost:
    "bg-transparent text-primary border border-primary hover:bg-surface-container-low active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer select-none";
  const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  const style = { borderRadius: "var(--radius-btn)" };

  if ((props as ButtonAsAnchor).as === "a") {
    const { as: _as, ...rest } = props as ButtonAsAnchor;
    return <a className={classes} style={style} {...rest} />;
  }

  const { as: _as, ...rest } = props as ButtonAsButton;
  return <button className={classes} style={style} {...rest} />;
}
