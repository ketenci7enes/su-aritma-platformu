"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "su-aritma-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function decide(value: "all" | "essential") {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // gizli mod: sessizce kapat
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Çerez izni"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-3xl rounded-2xl border border-border-soft bg-surface/95 p-4 shadow-xl backdrop-blur sm:inset-x-6"
    >
      <p className="text-sm text-ink-soft">
        Deneyimi iyileştirmek için zorunlu çerezleri ve (izninizle) ölçüm çerezlerini kullanıyoruz.
        Detaylar:{" "}
        <Link href="/kvkk" className="text-primary underline underline-offset-2">
          KVKK ve çerez politikası
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => decide("all")}>
          Tümünü kabul et
        </Button>
        <Button size="sm" variant="secondary" onClick={() => decide("essential")}>
          Yalnızca gerekli
        </Button>
      </div>
    </div>
  );
}
