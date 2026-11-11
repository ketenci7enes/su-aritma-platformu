"use client";

import { Check, Plus } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import { products } from "@/lib/data/products";
import { Button } from "@/components/ui/button";

const plan = products.find((product) => product.id === "p-subscription");

export function SubscriptionUpsell() {
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const active = useCartStore((state) =>
    state.lines.some((line) => line.productId === "p-subscription"),
  );

  if (!plan) return null;

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent-tint p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-accent-text">6 aylık filtre aboneliği</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            İlk yıl indirimli {formatPrice(plan.price)} · 170. günde otomatik hatırlatma · ücretsiz
            kargo ve değişim randevusu.
          </p>
        </div>
        <Button
          size="sm"
          variant={active ? "secondary" : "primary"}
          onClick={() => (active ? removeItem(plan.id) : addItem(plan))}
          aria-pressed={active}
        >
          {active ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Eklendi
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Abonelik başlat
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
