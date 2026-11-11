import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ChefHat, Coffee, Hotel } from "lucide-react";
import { B2BForm } from "@/components/b2b/b2b-form";
import { ProductCard } from "@/components/shop/product-card";
import { devices } from "@/lib/data/products";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Kurumsal",
  description:
    "HORECA sektörü için yüksek kapasiteli su arıtma çözümleri. Otel, restoran ve kafe için toplu teklif alın.",
  alternates: { canonical: "/kurumsal" },
};

const sectors = [
  { icon: Hotel, title: "Otel", text: "Oda başına içme suyu, büfe ve mutfak için sürekli akış." },
  { icon: ChefHat, title: "Restoran", text: "Lezzet standardı için kireçsiz su, ekipman ömrü." },
  { icon: Coffee, title: "Kafe", text: "Kahve demlemede tutarlı tat, buz makinesi koruması." },
  { icon: Building2, title: "Ofis", text: "Çalışan sayısına göre ölçeklenen arıtma çözümleri." },
];

const horecaDevices = devices.filter((device) => (device.capacityLpd ?? 0) >= 380);

export default function CorporatePage() {
  return (
    <div className="container-page py-10 md:py-14">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Kurumsal</p>
          <h1 className="text-h1 font-extrabold text-balance">
            HORECA için endüstriyel arıtma, tek elden.
          </h1>
          <p className="text-sm leading-relaxed text-ink-soft">
            Otel, restoran ve kafelerde su kalitesi doğrudan lezzet ve ekipman ömrüne etki eder.
            Yüksek kapasiteli cihazlar, periyodik filtre bakımı ve öncelikli servis anlaşmasıyla
            işinizi kesintisiz sürdürün.
          </p>
          <ul className="grid gap-2 text-xs text-ink-soft sm:grid-cols-2">
            {[
              "Ücretsiz keşif ve kapasite hesabı",
              "Öncelikli teknisyen ataması",
              "Toplu filtre aboneliği indirimi",
              "Faturalı kurumsal satış",
            ].map((item) => (
              <li key={item} className="rounded-xl border border-border-soft bg-surface px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
          <Link href="#teklif">
            <Button size="lg">Toplu teklif al</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {sectors.map((sector) => (
            <div
              key={sector.title}
              className="rounded-2xl border border-border-soft bg-surface p-4"
            >
              <sector.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="mt-2 text-sm font-bold">{sector.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{sector.text}</p>
            </div>
          ))}
        </div>
      </div>

      <section aria-labelledby="horeca-products" className="mt-14">
        <h2 id="horeca-products" className="text-h2 font-extrabold">
          Yüksek kapasiteli modeller
        </h2>
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {horecaDevices.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </section>

      <section id="teklif" aria-labelledby="quote-title" className="mt-14 scroll-mt-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 id="quote-title" className="text-h2 font-extrabold">
              Toplu teklif formu
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Formu doldurun; kurumsal ekibimiz tesisinizin günlük tüketimine göre kapasite ve
              maliyet hesabıyla dönsün.
            </p>
            <p className="mt-4 text-xs text-ink-soft">
              Yanıt süresi: 1 iş günü · Teklif geçerliliği: 30 gün
            </p>
          </div>
          <div className="card-soft p-5">
            <B2BForm />
          </div>
        </div>
      </section>
    </div>
  );
}
