import type { Metadata } from "next";
import { CartView } from "@/components/shop/cart-view";

export const metadata: Metadata = {
  title: "Sepet",
  description: "Sepetinizdeki ürünler, abonelik seçeneği ve toplam tutar.",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="text-h1 font-extrabold">Sepetim</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Kurulum ve kargo ücretsiz. Sipariş sonrası panelinizden randevu oluşturabilirsiniz.
      </p>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
