"use client";

import { useState } from "react";
import Link from "next/link";
import { Repeat, Truck, Wrench } from "lucide-react";
import { useDemoStore } from "@/lib/store/demo";
import { formatDateTR, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PanelEmpty, PanelHeader } from "@/components/panel/panel-shell";
import { FilterHealthCard } from "@/components/panel/filter-health-card";

export default function PanelFilterPage() {
  const orders = useDemoStore((state) => state.orders);
  const subscription = useDemoStore((state) => state.subscription);
  const cancelSubscription = useDemoStore((state) => state.cancelSubscription);
  const [confirming, setConfirming] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const order = orders[0];

  async function handleCancelSubscription() {
    setCancelError(null);
    setCancelling(true);
    const result = await cancelSubscription();
    setCancelling(false);
    setConfirming(false);
    if (!result.ok) {
      setCancelError(result.error ?? "Abonelik iptal edilemedi.");
    }
  }

  if (!order) {
    return (
      <div>
        <PanelHeader title="Filtre & Abonelik" subtitle="Filtre sağlığı ve abonelik durumu." />
        <PanelEmpty
          title="Cihaz kaydı bulunamadı"
          text="Sipariş oluşturduğunuzda filtre ömrü sayacı otomatik başlar."
          action={
            <Link href="/cihaz-bul">
              <Button>Cihazımı bul</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Filtre & Abonelik"
        subtitle="180 günlük filtre ömrü, 170. gün hatırlatması ve abonelik yönetimi."
      />

      <FilterHealthCard installedAt={order.createdAt} />

      <section className="rounded-2xl border border-border-soft bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <Repeat className="h-4 w-4 text-primary" aria-hidden="true" />6 aylık filtre aboneliği
            </h3>
            {subscription ? (
              <>
                <p className="mt-1 text-xs text-ink-soft">
                  {subscription.planName} · Sonraki fatura:{" "}
                  {formatDateTR(subscription.nextBillingAt)}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">Plan tutarı: {formatPrice(1190)}</p>
              </>
            ) : (
              <p className="mt-1 text-xs text-ink-soft">
                Aboneliğiniz yok. Filtre seti 6 ayda bir kapınıza gelsin, değişim randevusu otomatik
                planlansın.
              </p>
            )}
          </div>
          <Badge variant={subscription?.status === "active" ? "success" : "default"}>
            {subscription?.status === "active" ? "Aktif" : subscription ? "İptal edildi" : "Yok"}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {subscription?.status === "active" ? (
            confirming ? (
              <>
                <Button
                  variant="secondary"
                  loading={cancelling}
                  onClick={() => {
                    void handleCancelSubscription();
                  }}
                >
                  İptali onayla
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  Vazgeç
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setConfirming(true)}>
                Aboneliği iptal et
              </Button>
            )
          ) : (
            <Link href="/urunler/filtre-abonelik-6-ay">
              <Button>Abonelik başlat</Button>
            </Link>
          )}
        </div>

        {cancelError ? (
          <p role="alert" className="mt-2 text-xs font-semibold text-danger">
            {cancelError}
          </p>
        ) : null}

        {confirming ? (
          <p className="mt-2 text-xs text-ink-soft">
            İptal sonrası dönem sonuna kadar haklarınız korunur. Demo modda anında iptal edilir.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border-soft bg-surface p-5">
        <h3 className="text-sm font-bold">Filtre değişim seçenekleri</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            href="/panel/randevu"
            className="rounded-xl border border-border-soft p-4 transition-colors hover:border-primary"
          >
            <Wrench className="h-5 w-5 text-primary" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold">Teknisyen gelsin</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              Bölgenizdeki teknisyenin boş saatinden randevu oluşturun.
            </p>
          </Link>
          <div className="rounded-xl border border-border-soft bg-surface-muted p-4">
            <Truck className="h-5 w-5 text-primary" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold">Kendim değiştireceğim</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              Filtre seti kargo takip koduyla gelir; video kılavuz e-posta ile iletilir. (Faz 2)
            </p>
          </div>
        </div>
      </section>

      <p className="text-[11px] text-ink-soft">
        170. gün uyarısı hesabı Europe/Istanbul takvim gününe göre yapılır; zaman damgaları UTC
        saklanır.
      </p>
    </div>
  );
}
