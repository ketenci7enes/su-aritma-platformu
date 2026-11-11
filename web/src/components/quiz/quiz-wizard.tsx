"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowLeft, Check, Droplets, MapPin, ShoppingBag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ProductVisual } from "@/components/shop/product-visual";
import { provinceNames, districtsByProvince } from "@/lib/data/hardness";
import { recommendDevice, type Recommendation } from "@/lib/quiz/recommend";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";

const STEPS = ["Konum", "Analiz", "Kullanım", "Sonuç"] as const;

const LEVEL_LABEL: Record<string, string> = {
  soft: "Yumuşak su",
  medium: "Orta sertlik",
  hard: "Sert su",
  very_hard: "Çok sert su",
};

const LEVEL_VARIANT: Record<string, "success" | "primary" | "warning" | "danger"> = {
  soft: "success",
  medium: "primary",
  hard: "warning",
  very_hard: "danger",
};

export function QuizWizard() {
  const [step, setStep] = useState(0);
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [people, setPeople] = useState(3);
  const [result, setResult] = useState<Recommendation | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const districts = il ? (districtsByProvince[il] ?? []) : [];

  useEffect(() => {
    if (step !== 1) return;
    const timer = window.setTimeout(() => {
      setResult(recommendDevice({ il, ilce: ilce || undefined, people }));
      setStep(2);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [step, il, ilce, people]);

  function reset() {
    setStep(0);
    setResult(null);
    setIl("");
    setIlce("");
    setPeople(3);
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-2xl">
        <ol className="mb-8 flex items-center gap-2" aria-label="İlerleme">
          {STEPS.map((label, index) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                aria-current={index === step ? "step" : undefined}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  index < step
                    ? "bg-accent text-accent-text"
                    : index === step
                      ? "bg-primary text-surface"
                      : "bg-surface-muted text-ink-soft"
                }`}
              >
                {index < step ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
              </span>
              <span className="hidden text-xs font-medium text-ink-soft sm:block">{label}</span>
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={`h-0.5 flex-1 rounded ${index < step ? "bg-accent" : "bg-border-soft"}`}
                />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="card-soft overflow-hidden p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div
                key="location"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-5"
              >
                <header>
                  <p className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-primary uppercase">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    Adım 1
                  </p>
                  <h2 className="mt-2 text-h2 font-extrabold">Nerede yaşıyorsunuz?</h2>
                  <p className="mt-2 text-sm text-ink-soft">
                    Bölgenizin şebeke suyu sertliğine göre doğru filtrasyonu önerelim. İlçe bilgisi
                    opsiyoneldir.
                  </p>
                </header>

                <Select
                  label="İl"
                  value={il}
                  onChange={(event) => {
                    setIl(event.target.value);
                    setIlce("");
                  }}
                  required
                >
                  <option value="">İl seçin</option>
                  {provinceNames.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </Select>

                {districts.length > 0 ? (
                  <Select
                    label="İlçe (opsiyonel)"
                    value={ilce}
                    onChange={(event) => setIlce(event.target.value)}
                  >
                    <option value="">Seçmek istemiyorum</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    label="İlçe (opsiyonel)"
                    value={ilce}
                    onChange={(event) => setIlce(event.target.value)}
                    placeholder="Örn. Merkez"
                  />
                )}

                <Button size="lg" className="w-full" disabled={!il} onClick={() => setStep(1)}>
                  Su kalitemi analiz et
                </Button>
              </motion.div>
            ) : null}

            {step === 1 ? (
              <motion.div
                key="analysis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 text-center"
                role="status"
                aria-live="polite"
              >
                <div className="relative mx-auto h-24 w-24">
                  <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary/30" />
                  <span className="absolute inset-3 rounded-full border-2 border-primary/50" />
                  <span className="absolute inset-6 flex items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Droplets className="h-8 w-8" aria-hidden="true" />
                  </span>
                </div>
                <h2 className="mt-6 text-h3 font-bold">Şebeke suyunuz analiz ediliyor…</h2>
                <p className="mt-2 text-sm text-ink-soft">
                  {il}
                  {ilce ? ` / ${ilce}` : ""} için sertlik verisi sorgulanıyor.
                </p>
              </motion.div>
            ) : null}

            {step === 2 ? (
              <motion.div
                key="people"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-5"
              >
                <header>
                  <p className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-primary uppercase">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    Adım 3
                  </p>
                  <h2 className="mt-2 text-h2 font-extrabold">Evde kaç kişi yaşıyor?</h2>
                  <p className="mt-2 text-sm text-ink-soft">
                    Günlük kapasite ihtiyacını hesaplamak için kullanılır.
                  </p>
                </header>

                <div className="grid grid-cols-4 gap-2" role="group" aria-label="Kişi sayısı">
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      aria-pressed={people === count}
                      onClick={() => setPeople(count)}
                      className={`h-12 rounded-xl border text-sm font-semibold transition-colors ${
                        people === count
                          ? "border-primary bg-primary text-surface"
                          : "border-border-soft bg-surface hover:border-primary"
                      }`}
                    >
                      {count === 10 ? "10+" : count}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(0)}>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Geri
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={() => {
                      setResult(recommendDevice({ il, ilce: ilce || undefined, people }));
                      setStep(3);
                    }}
                  >
                    Sonucu göster
                  </Button>
                </div>
              </motion.div>
            ) : null}

            {step === 3 && result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <header className="text-center">
                  <p className="text-xs font-bold tracking-widest text-primary uppercase">Sonuç</p>
                  <h2 className="mt-2 text-h2 font-extrabold text-balance">
                    {result.hardness.level === "very_hard" || result.hardness.level === "hard"
                      ? "Bölgenizin kireçli suyu için en uygunu:"
                      : "Bölgeniz için en dengeli seçim:"}{" "}
                    <span className="text-primary">{result.product.name}</span>
                  </h2>
                </header>

                <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface-muted p-4 sm:flex-row">
                  <div className="h-32 w-40 shrink-0">
                    <ProductVisual product={result.product} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={LEVEL_VARIANT[result.hardness.level] ?? "default"}>
                        {LEVEL_LABEL[result.hardness.level]} · {result.hardness.ppm} ppm
                      </Badge>
                      <Badge variant="default">{result.product.stages} aşama</Badge>
                      <Badge variant="default">{result.product.capacityLpd} L/gün</Badge>
                    </div>
                    <p className="text-2xl font-extrabold text-primary-dark">
                      {formatPrice(result.product.price)}
                    </p>
                    <p className="text-xs text-ink-soft">{result.product.summary}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border-soft p-4">
                  <h3 className="text-sm font-bold">Neden bu model?</h3>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-soft">
                    {result.reasons.map((reason) => (
                      <li key={reason} className="flex gap-1.5">
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-text"
                          aria-hidden="true"
                        />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={() => {
                      addItem(result.product);
                      openCart();
                    }}
                  >
                    <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    Sepete ekle
                  </Button>
                  <Link href={`/urunler/${result.product.slug}`} className="sm:flex-1">
                    <Button size="lg" variant="secondary" className="w-full">
                      Detayları gör
                    </Button>
                  </Link>
                </div>

                <div className="flex justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-ink-soft underline"
                  >
                    Kişi sayısını değiştir
                  </button>
                  <button type="button" onClick={reset} className="text-ink-soft underline">
                    Baştan başla
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <p className="mt-4 text-center text-[11px] text-ink-soft">
          Sonuçlar ortalama bölgesel sertlik verisine dayanır; kesin analiz için ücretsiz su testi
          talep edebilirsiniz.
        </p>
      </div>
    </MotionConfig>
  );
}
