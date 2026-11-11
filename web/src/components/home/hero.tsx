import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "./hero-visual";

const trustItems = [
  { icon: Truck, label: "Ücretsiz kargo" },
  { icon: Wrench, label: "Ücretsiz kurulum" },
  { icon: ShieldCheck, label: "3 yıl garanti" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary-soft/70 via-white to-white"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-24 -z-10 h-96 w-96 rounded-full bg-primary-light/20 blur-3xl"
      />

      <div className="container-page grid items-center gap-12 py-14 md:grid-cols-2 md:py-24">
        <div className="space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-light/60 bg-surface px-3.5 py-1.5 text-xs font-semibold text-primary-dark">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Türkiye genelinde yetkili teknisyen ağı
          </span>

          <h1 className="text-h1 font-extrabold text-balance">
            Musluğunuzdan <span className="text-primary">berrak</span> bir gelecek akıyor.
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-ink-soft">
            Bölgenizin su sertliğine göre doğru cihazı seçin. Kurulum randevusundan 6 aylık filtre
            aboneliğine kadar her adım tek panelde, otomatik.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/cihaz-bul">
              <Button size="lg">
                Cihazımı bul
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/urunler">
              <Button size="lg" variant="secondary">
                Modelleri gör
              </Button>
            </Link>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-ink-soft">
            {trustItems.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5">
                <item.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
