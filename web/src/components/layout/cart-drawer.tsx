"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { cartSubtotal } from "@/lib/store/cart-math";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductVisual } from "@/components/shop/product-visual";

export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const lines = useCartStore((state) => state.lines);
  const setQty = useCartStore((state) => state.setQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const toggleSubscription = useCartStore((state) => state.toggleSubscription);
  const hasSubscription = lines.some((line) => line.slug === "filtre-abonelik-6-ay");
  const subtotal = cartSubtotal(lines);
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCart();
        return;
      }
      if (event.key !== "Tab") return;

      const root = drawerRef.current;
      if (!root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      triggerRef.current?.focus();
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={closeCart}
        className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
          <h2 id="cart-title" className="text-lg font-bold">
            Sepetim
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeCart}
            aria-label="Kapat"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-muted"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-10 w-10 text-ink-soft" aria-hidden="true" />
            <p className="text-sm text-ink-soft">Sepetiniz henüz boş.</p>
            <Link href="/urunler" onClick={closeCart}>
              <Button variant="secondary">Ürünlere göz at</Button>
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border-soft overflow-y-auto px-5">
              {lines.map((line) => (
                <li key={line.productId} className="flex gap-3 py-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                    <ProductVisual
                      product={{ tone: line.tone, category: "device", slug: line.slug }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{line.name}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{formatPrice(line.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="inline-flex items-center rounded-full border border-border-soft">
                        <button
                          type="button"
                          aria-label={`${line.name} adedini azalt`}
                          onClick={() => setQty(line.productId, line.qty - 1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-muted"
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold" aria-live="polite">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          aria-label={`${line.name} adedini artır`}
                          onClick={() => setQty(line.productId, line.qty + 1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-muted"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(line.productId)}
                        className="text-xs text-ink-soft underline-offset-2 hover:text-danger hover:underline"
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-bold">{formatPrice(line.price * line.qty)}</p>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-border-soft px-5 py-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-accent-tint p-3">
                <input
                  type="checkbox"
                  checked={hasSubscription}
                  onChange={toggleSubscription}
                  className="mt-0.5 h-4 w-4 accent-accent"
                />
                <span className="text-xs">
                  <span className="block font-semibold text-accent-text">
                    6 aylık filtre aboneliği ekle
                  </span>
                  <span className="text-ink-soft">
                    İlk yıl indirimli · 170. günde otomatik hatırlatma · ücretsiz kargo
                  </span>
                </span>
              </label>

              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Ara toplam</span>
                <span className="text-base font-bold">{formatPrice(subtotal)}</span>
              </div>
              <Link href="/sepet" onClick={closeCart} className="block">
                <Button className="w-full" size="lg">
                  Sepete git
                </Button>
              </Link>
              <p className="text-center text-[11px] text-ink-soft">
                Kargo ve kurulum ücretsiz · 14 gün içinde iade
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
