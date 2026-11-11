import { Check } from "lucide-react";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const flow: { status: OrderStatus; label: string }[] = [
  { status: "paid", label: "Ödeme alındı" },
  { status: "shipped", label: "Kargoda" },
  { status: "delivered", label: "Teslim edildi" },
  { status: "installed", label: "Kuruldu" },
];

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
        Bu sipariş iptal edildi.
      </p>
    );
  }

  const currentIndex = Math.max(
    0,
    flow.findIndex((step) => step.status === status),
  );

  return (
    <ol
      className="flex items-center gap-1"
      aria-label={`Sipariş durumu: ${flow[currentIndex]?.label}`}
    >
      {flow.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <li key={step.status} className="flex flex-1 items-center gap-1">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                done ? "bg-accent text-accent-text" : "bg-surface-muted text-ink-soft",
              )}
            >
              {index < currentIndex ? <Check className="h-3 w-3" aria-hidden="true" /> : index + 1}
            </span>
            <span
              className={cn(
                "hidden text-[10px] font-medium sm:block",
                done ? "text-ink" : "text-ink-soft",
              )}
            >
              {step.label}
            </span>
            {index < flow.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "h-0.5 flex-1 rounded",
                  index < currentIndex ? "bg-accent" : "bg-border-soft",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
