"use client";

import * as React from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function AddToCart({ product }: { product: Product }) {
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  function handleAdd() {
    addItem(product, qty);
    setAdded(true);
    openCart();
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-border-soft">
          <button
            type="button"
            aria-label="Adedi azalt"
            onClick={() => setQty((value) => Math.max(1, value - 1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-muted"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="w-8 text-center text-sm font-bold" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Adedi artır"
            onClick={() => setQty((value) => Math.min(10, value + 1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-muted"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <Button size="lg" onClick={handleAdd} className="flex-1">
          {added ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Sepete eklendi
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Sepete ekle · {formatPrice(product.price * qty)}
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-ink-soft" aria-live="polite">
        {added ? "Sepet çekmecesi açıldı." : "Ücretsiz kargo ve kurulum dahil."}
      </p>
    </div>
  );
}
