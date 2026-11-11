import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-muted text-ink-soft border-border-soft",
  primary: "bg-primary-soft text-primary-dark border-primary-light/50",
  success: "bg-accent-tint text-accent-text border-accent/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
