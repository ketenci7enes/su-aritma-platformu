"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { cartSubtotal } from "@/lib/store/cart-math";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductVisual } from "@/components/shop/product-visual";

export function CartView() {
  const lines = useCartStore((state) => state.lines);
  const setQty = useCartStore((state) => state.setQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const toggleSubscription = useCartStore((state) => state.toggleSubscription);
  const hasSubscription = lines.some((line) => line.slug === "filtre-abonelik-6-ay");
  const subtotal = cartSubtotal(lines);

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl border border-border-soft bg-surface p-10 text-center">
        <h2 className="text-h3 font-bold">Sepetiniz boş</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
          Cihaz seçici ile ihtiyacınıza uygun modeli bulabilir veya tüm ürünlere göz atabilirsiniz.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/cihaz-bul">
            <Button>Cihazımı bul</Button>
          </Link>
          <Link href="/urunler">
            <Button variant="secondary">Ürünlere göz at</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <ul className="divide-y divide-border-soft rounded-2xl border border-border-soft">
        {lines.map((line) => (
          <li key={line.productId} className="flex gap-4 p-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
              <ProductVisual product={{ tone: line.tone, category: "device", slug: line.slug }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/urunler/${line.slug}`}
                    className="text-sm font-bold hover:text-primary"
                  >
                    {line.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-soft">{formatPrice(line.price)} / adet</p>
                </div>
                <p className="text-sm font-extrabold">{formatPrice(line.price * line.qty)}</p>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-border-soft">
                  <button
                    type="button"
                    aria-label={`${line.name} adedini azalt`}
                    onClick={() => setQty(line.productId, line.qty - 1)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-muted"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{line.qty}</span>
                  <button
                    type="button"
                    aria-label={`${line.name} adedini artır`}
                    onClick={() => setQty(line.productId, line.qty + 1)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-muted"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(line.productId)}
                  className="inline-flex items-center gap-1 text-xs text-ink-soft hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Kaldır
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-2xl border border-border-soft bg-surface p-5">
        <h2 className="text-lg font-bold">Özet</h2>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-accent-tint p-3">
          <input
            type="checkbox"
            checked={hasSubscription}
            onChange={toggleSubscription}
            className="mt-0.5 h-4 w-4 accent-accent"
          />
          <span className="text-xs">
            <span className="block font-semibold text-accent-text">6 aylık filtre aboneliği</span>
            <span className="text-ink-soft">İlk yıl indirimli, ücretsiz kargo</span>
          </span>
        </label>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Ara toplam</dt>
            <dd className="font-semibold">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Kargo</dt>
            <dd className="font-semibold text-accent-text">Ücretsiz</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Kurulum</dt>
            <dd className="font-semibold text-accent-text">Ücretsiz</dd>
          </div>
          <div className="flex justify-between border-t border-border-soft pt-3 text-base">
            <dt className="font-bold">Toplam</dt>
            <dd className="font-extrabold">{formatPrice(subtotal)}</dd>
          </div>
        </dl>

        <Link href="/odeme" className="mt-5 block">
          <Button size="lg" className="w-full">
            Ödemeye geç
          </Button>
        </Link>
        <Link href="/urunler" className="mt-3 block text-center text-xs text-ink-soft underline">
          Alışverişe devam et
        </Link>
      </aside>
    </div>
  );
}
