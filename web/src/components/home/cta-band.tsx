import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="container-page py-16 md:py-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-dark via-primary to-primary-light px-6 py-12 text-center md:px-14">
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-10 h-64 w-64 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-white/10 blur-2xl"
        />
        <h2 className="relative text-h2 font-extrabold text-balance text-surface">
          Bölgenizin suyu hangi cihazı istiyor?
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/80">
          60 saniyelik seçici: il/ilçe, kişi sayısı ve su sertliği verisiyle size en uygun modeli
          önerelim.
        </p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/cihaz-bul">
            <Button size="lg">
              Cihazımı bul
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href="/urunler">
            <Button
              size="lg"
              variant="secondary"
              className="border-white/50 bg-white/10 text-white hover:bg-white/20"
            >
              Tüm modeller
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
