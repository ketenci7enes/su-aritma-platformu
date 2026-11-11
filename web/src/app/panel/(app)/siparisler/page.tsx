"use client";

import Link from "next/link";
import { useDemoStore } from "@/lib/store/demo";
import { formatDateTimeTR, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PanelEmpty, PanelHeader } from "@/components/panel/panel-shell";
import { OrderStatusTimeline } from "@/components/panel/order-status-timeline";

export default function PanelOrdersPage() {
  const orders = useDemoStore((state) => state.orders);

  return (
    <div>
      <PanelHeader title="Siparişler" subtitle="Sipariş durumları ve kalem detayları." />

      {orders.length === 0 ? (
        <PanelEmpty
          title="Sipariş bulunamadı"
          text="İlk siparişinizi oluşturduğunuzda burada listelenecek."
          action={
            <Link href="/urunler">
              <Button>Ürünlere göz at</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-border-soft bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold">{order.id}</p>
                  <p className="text-xs text-ink-soft">{formatDateTimeTR(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={order.status === "cancelled" ? "danger" : "success"}>
                    {order.status === "cancelled" ? "İptal" : "Ödendi"}
                  </Badge>
                  <span className="text-sm font-bold">{formatPrice(order.total)}</span>
                </div>
              </div>

              <div className="mt-4">
                <OrderStatusTimeline status={order.status} />
              </div>

              <ul className="mt-4 divide-y divide-border-soft">
                {order.lines.map((line) => (
                  <li key={line.productId} className="flex justify-between gap-3 py-2 text-sm">
                    <span className="text-ink-soft">
                      {line.name} × {line.qty}
                    </span>
                    <span className="font-semibold">{formatPrice(line.price * line.qty)}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-xs text-ink-soft">
                Teslimat: {order.address.il} / {order.address.ilce} · {order.address.line}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
