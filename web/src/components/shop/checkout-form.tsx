"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart";
import { useDemoStore } from "@/lib/store/demo";
import { cartSubtotal } from "@/lib/store/cart-math";
import { checkoutSchema } from "@/lib/validation";
import { getPaymentProvider } from "@/lib/payments";
import { formatPrice } from "@/lib/utils";
import { provinceNames, districtsByProvince } from "@/lib/data/hardness";
import type { Order } from "@/lib/types";

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  il: string;
  ilce: string;
  line: string;
}

const initialForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  il: "",
  ilce: "",
  line: "",
};

export function CheckoutForm() {
  const router = useRouter();
  const lines = useCartStore((state) => state.lines);
  const clear = useCartStore((state) => state.clear);
  const placeOrder = useDemoStore((state) => state.placeOrder);
  const hasSubscription = lines.some((line) => line.slug === "filtre-abonelik-6-ay");
  const subtotal = cartSubtotal(lines);

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const districts = form.il ? (districtsByProvince[form.il] ?? []) : [];

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPaymentError(null);

    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    if (lines.length === 0) {
      setPaymentError("Sepetiniz boş. Önce ürün ekleyin.");
      return;
    }

    setSubmitting(true);
    try {
      const draft: Order = {
        id: "draft",
        createdAt: new Date().toISOString(),
        status: "pending",
        total: subtotal,
        lines,
        address: {
          title: "Ev",
          il: parsed.data.il,
          ilce: parsed.data.ilce,
          line: parsed.data.line,
          phone: parsed.data.phone,
        },
        paymentRef: "",
        email: parsed.data.email,
        subscription: hasSubscription,
      };

      const provider = getPaymentProvider();
      const session = await provider.createCheckoutSession(draft);

      if (session.status === "failed") {
        setPaymentError("Ödeme başarısız oldu (mock). Lütfen tekrar deneyin.");
        setSubmitting(false);
        return;
      }

      const order = placeOrder({
        email: parsed.data.email,
        lines,
        total: subtotal,
        address: draft.address,
        subscription: hasSubscription,
        paymentRef: session.id,
      });

      clear();
      router.push(`/odeme/sonuc?durum=basarili&siparis=${order.id}`);
    } catch {
      setPaymentError("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl border border-border-soft bg-surface p-10 text-center">
        <h2 className="text-h3 font-bold">Ödeme için sepetinizde ürün olmalı</h2>
        <p className="mt-2 text-sm text-ink-soft">Ürünlere göz atıp sepetinize ekleyin.</p>
        <Link href="/urunler" className="mt-5 inline-block">
          <Button>Ürünlere git</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-5">
        <section aria-labelledby="contact-title" className="card-soft p-5">
          <h2 id="contact-title" className="text-h3 font-bold">
            İletişim
          </h2>
          <p className="mt-1 text-xs text-ink-soft">
            Sipariş ve kurulum bilgileri bu e-posta/telefon üzerinden iletilir.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Ad soyad"
              name="fullName"
              autoComplete="name"
              required
              value={form.fullName}
              onChange={(event) => update("fullName", event.target.value)}
              error={errors.fullName}
            />
            <Input
              label="E-posta"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              error={errors.email}
              hint="Panel giriş bağlantısı bu adrese gönderilir."
            />
            <Input
              label="Cep telefonu"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              placeholder="05xx xxx xx xx"
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              error={errors.phone}
            />
          </div>
        </section>

        <section aria-labelledby="address-title" className="card-soft p-5">
          <h2 id="address-title" className="text-h3 font-bold">
            Teslimat adresi
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select
              label="İl"
              name="il"
              required
              value={form.il}
              onChange={(event) => {
                update("il", event.target.value);
                update("ilce", "");
              }}
              error={errors.il}
            >
              <option value="">İl seçin</option>
              {provinceNames.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </Select>
            <Input
              label="İlçe"
              name="ilce"
              required
              list="district-options"
              value={form.ilce}
              onChange={(event) => update("ilce", event.target.value)}
              error={errors.ilce}
            />
            <datalist id="district-options">
              {districts.map((district) => (
                <option key={district} value={district} />
              ))}
            </datalist>
            <div className="sm:col-span-2">
              <Input
                label="Açık adres"
                name="line"
                autoComplete="street-address"
                required
                placeholder="Mahalle, cadde, no, daire"
                value={form.line}
                onChange={(event) => update("line", event.target.value)}
                error={errors.line}
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="payment-title" className="card-soft p-5">
          <h2 id="payment-title" className="text-h3 font-bold">
            Ödeme
          </h2>
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-border-soft bg-surface-muted p-4">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="text-xs">
              <p className="font-semibold">Mock ödeme sağlayıcısı</p>
              <p className="mt-1 leading-relaxed text-ink-soft">
                Faz 1&apos;de gerçek kart bilgisi istenmez; sipariş anında onaylanır. Kart verisi
                hiçbir zaman sistemimizden geçmez (K2).
              </p>
            </div>
          </div>
          {paymentError ? (
            <p role="alert" className="mt-3 text-sm font-medium text-danger">
              {paymentError}
            </p>
          ) : null}
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-border-soft bg-surface p-5">
        <h2 className="text-lg font-bold">Sipariş özeti</h2>
        <ul className="mt-3 divide-y divide-border-soft">
          {lines.map((line) => (
            <li key={line.productId} className="flex justify-between gap-3 py-2.5 text-sm">
              <span className="text-ink-soft">
                {line.name} <span aria-hidden="true">×</span> {line.qty}
              </span>
              <span className="font-semibold">{formatPrice(line.price * line.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-border-soft pt-3 text-base">
          <span className="font-bold">Toplam</span>
          <span className="font-extrabold">{formatPrice(subtotal)}</span>
        </div>
        <Button
          type="submit"
          size="lg"
          className="mt-5 w-full"
          loading={submitting}
          disabled={submitting}
        >
          {submitting ? "İşleniyor" : `Siparişi tamamla · ${formatPrice(subtotal)}`}
        </Button>
        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-ink-soft">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          Devam ederek mesafeli satış ve KVKK metinlerini kabul etmiş olursunuz.
        </p>
      </aside>
    </form>
  );
}
