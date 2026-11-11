"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CalendarCheck, CreditCard, Droplets, Repeat } from "lucide-react";

const steps = [
  {
    icon: CreditCard,
    title: "Sipariş",
    text: "Cihazı sepete ekleyin, adresinizi girin. Mock ödeme ile anında onay alın.",
  },
  {
    icon: CalendarCheck,
    title: "Otomatik randevu",
    text: "Kargo teslim edildiğinde panelinizde bölgenizdeki teknisyenin boş saatleri açılır.",
  },
  {
    icon: Droplets,
    title: "Kurulum",
    text: "Yetkili teknisyen kurulumu tamamlar; garanti ve filtre sayacı otomatik başlar.",
  },
  {
    icon: Repeat,
    title: "6 aylık abonelik",
    text: "170. günde hatırlatma gelir, filtre değişimi için tek tıkla randevu oluşturursunuz.",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 55%"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section aria-labelledby="how-title" className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">Nasıl çalışır</p>
        <h2 id="how-title" className="mt-2 text-h2 font-extrabold">
          Dört adımda arıtılmış su
        </h2>
        <p className="mt-3 text-sm text-ink-soft">
          Siparişten filtre değişimine kadar tüm süreç otomatik ilerler; siz sadece suyunuzu için.
        </p>
      </div>

      <div ref={ref} className="relative mt-12 md:mt-16">
        <div className="absolute top-0 left-6 h-full w-0.5 bg-border-soft md:left-1/2 md:-translate-x-1/2">
          <motion.div
            className="h-full w-full origin-top bg-primary"
            style={{ scaleY: lineScale }}
          />
        </div>

        <ol className="space-y-8 md:space-y-12">
          {steps.map((step, index) => (
            <Step key={step.title} step={step} index={index} progress={scrollYProgress} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Step({
  step,
  index,
  progress,
}: {
  step: (typeof steps)[number];
  index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const start = index / steps.length;
  const opacity = useTransform(progress, [start, Math.min(1, start + 0.25)], [0.45, 1]);
  const y = useTransform(progress, [start, Math.min(1, start + 0.25)], [16, 0]);

  return (
    <motion.li
      style={{ opacity, y }}
      className={`relative flex gap-5 pl-16 md:w-1/2 md:pl-0 ${
        index % 2 === 0 ? "md:pr-14 md:text-right" : "md:ml-auto md:pl-14"
      }`}
    >
      <span
        className={`absolute top-0 left-0 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-primary bg-surface text-primary shadow-sm ${
          index % 2 === 0 ? "md:right-0 md:left-auto" : "md:left-0"
        }`}
      >
        <step.icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="rounded-2xl border border-border-soft bg-surface p-5 shadow-sm">
        <p className="text-[11px] font-bold tracking-widest text-ink-soft uppercase">
          Adım {index + 1}
        </p>
        <h3 className="mt-1 text-h3 font-bold">{step.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.text}</p>
      </div>
    </motion.li>
  );
}
