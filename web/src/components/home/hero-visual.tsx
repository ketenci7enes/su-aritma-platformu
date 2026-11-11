"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Hero cihaz görseli: R3F yerine CSS 3D (K9 performans stratejisi).
 * Fare hareketine duyarlı, prefers-reduced-motion'da tamamen statik.
 */
export function HeroVisual({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: -4, y: 8 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setRotation({ x: -4 - py * 10, y: 8 + px * 16 });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setRotation({ x: -4, y: 8 })}
      className={cn("relative mx-auto w-full max-w-md [perspective:1200px]", className)}
      aria-hidden="true"
    >
      {/* su halkaları */}
      <span className="absolute inset-x-10 bottom-6 h-24 rounded-[50%] border border-primary-light/50" />
      <span className="animate-ripple absolute inset-x-16 bottom-10 h-16 rounded-[50%] border border-primary-light/60" />
      <span
        className="animate-ripple absolute inset-x-20 bottom-14 h-12 rounded-[50%] border border-primary-light/40"
        style={{ animationDelay: "1.4s" }}
      />

      {/* yükselen damlalar */}
      {[
        { left: "18%", delay: "0s", size: 8 },
        { left: "36%", delay: "1.8s", size: 6 },
        { left: "62%", delay: "3.2s", size: 7 },
        { left: "78%", delay: "0.9s", size: 5 },
      ].map((drop) => (
        <span
          key={drop.left}
          className="animate-droplet absolute bottom-24 rounded-full bg-primary-light/70"
          style={{
            left: drop.left,
            width: drop.size,
            height: drop.size * 1.35,
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            animationDelay: drop.delay,
          }}
        />
      ))}

      <div
        className="animate-drop-float relative mx-auto w-[78%] transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform: reducedMotion ? "none" : `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* gövde */}
        <div className="relative rounded-[2rem] bg-gradient-to-br from-primary to-primary-dark p-3 shadow-[0_30px_60px_-25px_rgba(2,132,199,0.55)]">
          <div className="relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-surface to-primary-soft/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-primary uppercase">
                AquaPure Pro
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            </div>
            <div className="flex gap-2.5">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="flex-1 rounded-full bg-gradient-to-b from-primary-light to-primary"
                  style={{ height: 96 + (index % 2) * 14 }}
                >
                  <div className="mx-1.5 mt-3 h-1.5 rounded-full bg-white/50" />
                  <div className="mx-1.5 mt-1.5 h-1.5 rounded-full bg-white/30" />
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary" fill="currentColor">
                    <path d="M12 2.2c3.9 4.3 6.4 7.6 6.4 11.1A6.4 6.4 0 0 1 12 19.7a6.4 6.4 0 0 1-6.4-6.4C5.6 9.8 8.1 6.5 12 2.2Z" />
                  </svg>
                </span>
                <div className="space-y-1">
                  <div className="h-1.5 w-16 rounded-full bg-ink/15" />
                  <div className="h-1.5 w-10 rounded-full bg-ink/10" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-primary">6 AŞAMA</span>
            </div>
          </div>
        </div>

        {/* musluk */}
        <div className="absolute -top-10 right-6 flex flex-col items-center">
          <div className="h-16 w-2 rounded-t-full bg-primary" />
          <div className="h-2 w-12 rounded-full bg-primary" />
          <span className="animate-droplet mt-1 h-3 w-2 rounded-full bg-primary/70" />
        </div>
      </div>

      {/* güven kartı */}
      <div className="absolute -bottom-2 left-0 rounded-2xl border border-border-soft bg-surface/90 p-3 shadow-lg backdrop-blur">
        <p className="text-[10px] font-medium text-ink-soft">Filtre sağlığı</p>
        <p className="text-lg font-extrabold text-primary-dark">%94</p>
        <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full w-[94%] rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}
