import { Suspense } from "react";
import type { Metadata } from "next";
import { OrderSuccess } from "@/components/shop/order-success";

export const metadata: Metadata = {
  title: "Sipariş onayı",
  robots: { index: false },
};

export default function OrderSuccessPage() {
  return (
    <div className="container-page py-10 md:py-14">
      <Suspense
        fallback={
          <p className="mx-auto max-w-xl py-10 text-center text-sm text-ink-soft">Yükleniyor…</p>
        }
      >
        <OrderSuccess />
      </Suspense>
    </div>
  );
}
