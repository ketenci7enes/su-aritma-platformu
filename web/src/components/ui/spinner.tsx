import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
} as const;

export function Spinner({
  size = "md",
  className,
}: {
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="Yükleniyor"
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent",
        sizeClasses[size],
        className,
      )}
    />
  );
}
