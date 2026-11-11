import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-5 py-20 text-center">
      <p className="text-sm font-bold tracking-widest text-primary uppercase">404</p>
      <h1 className="text-h1 font-extrabold text-balance">Bu sayfa damladı, buharlaştı.</h1>
      <p className="max-w-md text-sm text-ink-soft">
        Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir. Ana sayfadan devam edebilir veya
        ürünlere göz atabilirsiniz.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/">
          <Button>Ana sayfaya dön</Button>
        </Link>
        <Link href="/urunler">
          <Button variant="secondary">Ürünleri gör</Button>
        </Link>
      </div>
    </div>
  );
}
