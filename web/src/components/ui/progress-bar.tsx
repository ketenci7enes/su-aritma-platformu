import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  label,
  tone = "primary",
  className,
}: {
  value: number;
  label: string;
  tone?: "primary" | "accent" | "warning" | "danger";
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const toneClass = {
    primary: "bg-primary",
    accent: "bg-accent",
    warning: "bg-warning",
    danger: "bg-danger",
  }[tone];

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-surface-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", toneClass)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
