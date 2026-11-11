import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/checkout-form";

export const metadata: Metadata = {
  title: "Ödeme",
  description: "Teslimat bilgileri ve mock ödeme ile siparişi tamamlayın.",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="text-h1 font-extrabold">Ödeme</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Bilgilerinizi doğrulayın. Sipariş sonrası kurulum randevunuzu panelden seçebilirsiniz.
      </p>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
