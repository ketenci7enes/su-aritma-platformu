"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-5 py-20 text-center">
      <p className="text-sm font-bold tracking-widest text-danger uppercase">Beklenmeyen hata</p>
      <h1 className="text-h1 font-extrabold text-balance">Bir şeyler ters gitti.</h1>
      <p className="max-w-md text-sm text-ink-soft">
        Sayfayı yenilemeyi deneyin. Sorun sürerse destek ekibimiz panelden size ulaşabilir.
      </p>
      {error.digest ? <p className="text-xs text-ink-soft">Hata kodu: {error.digest}</p> : null}
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Tekrar dene</Button>
        <a href="/panel/destek">
          <Button variant="secondary">Desteğe git</Button>
        </a>
      </div>
    </div>
  );
}
