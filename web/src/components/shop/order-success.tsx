"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, XCircle } from "lucide-react";
import { useDemoStore } from "@/lib/store/demo";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { formatDateTimeTR, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function OrderSuccess() {
  const params = useSearchParams();
  const orderId = params.get("siparis");
  const status = params.get("durum");
  const [mounted, setMounted] = useState(false);
  const order = useDemoStore((state) => state.orders.find((item) => item.id === orderId));

  useEffect(() => setMounted(true), []);

  if (status === "basarisiz") {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-danger/30 bg-surface p-8 text-center">
        <XCircle className="mx-auto h-12 w-12 text-danger" aria-hidden="true" />
        <h1 className="mt-4 text-h2 font-extrabold">Ödeme tamamlanamadı</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Kartınızdan çekim yapılmadı. Sepetiniz korunuyor; tekrar deneyebilirsiniz.
        </p>
        <Link href="/odeme" className="mt-5 inline-block">
          <Button>Tekrar dene</Button>
        </Link>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="mx-auto max-w-xl py-10 text-center text-sm text-ink-soft">Yükleniyor…</div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border-soft bg-surface p-8 text-center">
        <h1 className="text-h2 font-extrabold">Sipariş bulunamadı</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Bu tarayıcıda kayıtlı sipariş yok (demo mod verisi tarayıcıda tutulur). Panelden kontrol
          edebilirsiniz.
        </p>
        <Link href="/panel" className="mt-5 inline-block">
          <Button>Panele git</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-3xl border border-accent/30 bg-accent-tint p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-accent-text" aria-hidden="true" />
        <p className="mt-2 text-xs font-bold tracking-widest text-accent-text uppercase">
          Sipariş alındı
        </p>
        <h1 className="mt-1 text-h2 font-extrabold">Teşekkürler! Suyunuz yolda.</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Sipariş numaranız <strong className="text-ink">{order.id}</strong> ·{" "}
          {formatDateTimeTR(order.createdAt)}
        </p>
      </div>

      <div className="card-soft mt-5 p-5">
        <h2 className="text-lg font-bold">Sipariş özeti</h2>
        <ul className="mt-3 divide-y divide-border-soft">
          {order.lines.map((line) => (
            <li key={line.productId} className="flex justify-between gap-3 py-2.5 text-sm">
              <span className="text-ink-soft">
                {line.name} × {line.qty}
              </span>
              <span className="font-semibold">{formatPrice(line.price * line.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-border-soft pt-3">
          <span className="font-bold">Toplam</span>
          <span className="font-extrabold">{formatPrice(order.total)}</span>
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Teslimat: {order.address.il} / {order.address.ilce} · {order.address.line}
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-border-soft bg-surface p-5">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-bold">Panel giriş bağlantısı</h2>
            {isSupabaseConfigured() ? (
              <p className="mt-1 text-xs text-ink-soft">
                <strong>{order.email}</strong> adresine magic link gönderildi. Bağlantı 1 saat
                geçerlidir.
              </p>
            ) : (
              <p className="mt-1 text-xs text-ink-soft">
                <strong>Demo mod:</strong> gerçek e-posta gönderilmedi.{" "}
                <Link href="/panel/giris" className="text-primary underline underline-offset-2">
                  Panel girişinden
                </Link>{" "}
                <strong>{order.email}</strong> ile devam edebilirsiniz.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/panel">
          <Button size="lg">Panelime git</Button>
        </Link>
        <Link href="/panel/randevu">
          <Button size="lg" variant="secondary">
            Randevu oluştur
          </Button>
        </Link>
      </div>
    </div>
  );
}
