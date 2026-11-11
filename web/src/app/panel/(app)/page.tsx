"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, LifeBuoy, Package, ShieldCheck } from "lucide-react";
import { useDemoStore } from "@/lib/store/demo";
import { formatDateTR, formatDateTimeTR, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PanelEmpty, PanelHeader } from "@/components/panel/panel-shell";
import { OrderStatusTimeline } from "@/components/panel/order-status-timeline";
import { FilterHealthCard } from "@/components/panel/filter-health-card";
import { ProductVisual } from "@/components/shop/product-visual";
import { getProductById } from "@/lib/data/products";

export default function PanelDashboardPage() {
  const orders = useDemoStore((state) => state.orders);
  const appointments = useDemoStore((state) => state.appointments);
  const subscription = useDemoStore((state) => state.subscription);
  const order = orders[0];
  const appointment = appointments[0];

  if (!order) {
    return (
      <div>
        <PanelHeader
          title="Genel Bakış"
          subtitle="Siparişiniz oluştuğunda cihaz, randevu ve filtre bilgileri burada görünür."
        />
        <PanelEmpty
          title="Henüz siparişiniz yok"
          text="Cihaz seçici ile ihtiyacınıza uygun modeli bulun; sipariş sonrası tüm süreç bu panelde ilerler."
          action={
            <Link href="/cihaz-bul">
              <Button>
                Cihazımı bul
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const deviceLine = order.lines.find((line) => {
    const product = getProductById(line.productId);
    return product?.category === "device";
  });
  const device = deviceLine ? getProductById(deviceLine.productId) : undefined;

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Genel Bakış"
        subtitle="Sipariş, kurulum ve filtre süreçlerinizin özeti."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-border-soft bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-ink-soft">
                <Package className="h-3.5 w-3.5" aria-hidden="true" />
                Son sipariş
              </p>
              <p className="mt-1 text-sm font-bold">{order.id}</p>
              <p className="text-xs text-ink-soft">{formatDateTimeTR(order.createdAt)}</p>
            </div>
            <Badge variant="success">Ödendi</Badge>
          </div>
          <div className="mt-4">
            <OrderStatusTimeline status={order.status} />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-ink-soft">
              {order.lines.length} kalem · {formatPrice(order.total)}
            </span>
            <Link href="/panel/siparisler" className="text-xs font-semibold text-primary underline">
              Detaylar
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-border-soft bg-surface p-5">
          <p className="flex items-center gap-1.5 text-xs text-ink-soft">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Cihazınız
          </p>
          {device && deviceLine ? (
            <div className="mt-2 flex items-center gap-3">
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                <ProductVisual product={device} />
              </div>
              <div>
                <p className="text-sm font-bold">{device.name}</p>
                <p className="text-xs text-ink-soft">
                  {device.stages} aşama · {device.capacityLpd} L/gün
                </p>
                <p className="mt-1 text-[11px] text-ink-soft">
                  Seri no: AP-{order.id.replace(/[^0-9]/g, "").slice(-6) || "000001"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">Bu siparişte cihaz bulunmuyor.</p>
          )}
          <p className="mt-3 text-[11px] text-ink-soft">
            Garanti başlangıcı: {formatDateTR(order.createdAt)} (3 yıl)
          </p>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FilterHealthCard installedAt={order.createdAt} />

        <section className="rounded-2xl border border-border-soft bg-surface p-5">
          <p className="flex items-center gap-1.5 text-xs text-ink-soft">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Randevu
          </p>
          {appointment ? (
            <>
              <p className="mt-2 text-sm font-bold">{formatDateTimeTR(appointment.slotStart)}</p>
              <p className="text-xs text-ink-soft">
                {appointment.technicianName} ·{" "}
                {appointment.type === "install" ? "Kurulum" : "Filtre değişimi"}
              </p>
              <Badge variant="primary" className="mt-2">
                Onaylandı
              </Badge>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm font-semibold">Randevunuz planlanmadı</p>
              <p className="mt-1 text-xs text-ink-soft">
                Bölgenizdeki teknisyenin boş saatlerinden birini seçin.
              </p>
              <Link href="/panel/randevu" className="mt-3 inline-block">
                <Button size="sm" variant="secondary">
                  Randevu oluştur
                </Button>
              </Link>
            </>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border-soft bg-primary-soft/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold">Bir sorun mu var?</h3>
            <p className="mt-1 text-xs text-ink-soft">
              Basınç, sızıntı veya tat sorununu tek tıkla bildirin; bölge teknisyenine iletilir.
            </p>
          </div>
          <Link href="/panel/destek">
            <Button>
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              Tek tıkla destek
            </Button>
          </Link>
        </div>
      </section>

      {subscription ? (
        <p className="text-xs text-ink-soft">
          Abonelik: <strong className="text-ink">{subscription.planName}</strong> ·{" "}
          {subscription.status === "active" ? "Aktif" : "İptal edildi"} · Sonraki fatura:{" "}
          {formatDateTR(subscription.nextBillingAt)}
        </p>
      ) : null}

      <p className="text-[11px] text-ink-soft">
        Demo mod: kurulum tarihi sipariş tarihi kabul edilir; gerçek akışta kargo teslimi ve
        teknisyen kurulumu ayrı olaylardır.
      </p>
    </div>
  );
}
