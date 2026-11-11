"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  // accent yalnızca birincil CTA'da kullanılır (yol haritası §4.1)
  primary:
    "bg-accent text-accent-text hover:bg-accent-hover active:bg-accent shadow-sm font-semibold",
  secondary:
    "border border-primary text-primary bg-surface hover:bg-primary-soft active:bg-primary-light/40 font-semibold",
  ghost: "bg-transparent text-ink hover:bg-surface-muted active:bg-border-soft font-medium",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, ...props },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={props.type ?? "button"}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors duration-200",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size="sm" className="text-current" /> : null}
      {children}
    </button>
  );
});
