import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="AquaPure ana sayfa"
      className={cn(
        "inline-flex items-center gap-2 font-extrabold tracking-tight text-ink",
        className,
      )}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
          <path d="M12 2.2c3.9 4.3 6.4 7.6 6.4 11.1A6.4 6.4 0 0 1 12 19.7a6.4 6.4 0 0 1-6.4-6.4C5.6 9.8 8.1 6.5 12 2.2Zm0 4.9c-2.1 2.5-3.5 4.5-3.5 6.2a3.5 3.5 0 1 0 7 0c0-1.7-1.4-3.7-3.5-6.2Z" />
        </svg>
      </span>
      {!compact ? (
        <span className="text-lg">
          Aqua<span className="text-primary">Pure</span>
        </span>
      ) : null}
    </Link>
  );
}
