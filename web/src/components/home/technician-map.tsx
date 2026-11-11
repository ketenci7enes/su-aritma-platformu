"use client";

import { useState } from "react";
import { MapPin, Wrench } from "lucide-react";
import { regions, regionStats } from "@/lib/data/regions";
import { cn } from "@/lib/utils";

const TURKEY_PATH =
  "M4,32 L9,26 L15,28 L19,22 L26,21 L31,15 L38,17 L44,13 L51,15 L57,12 L64,15 L71,14 L78,18 L85,22 L90,28 L87,34 L80,37 L83,42 L79,48 L75,52 L77,58 L71,61 L72,67 L66,70 L61,76 L54,78 L49,74 L44,76 L39,71 L33,69 L29,63 L24,60 L20,53 L15,50 L13,43 L8,39 Z";

export function TechnicianMap() {
  const [activeId, setActiveId] = useState<string | null>("antalya");
  const active = regions.find((region) => region.id === activeId);

  return (
    <section aria-labelledby="map-title" className="container-page py-16 md:py-24">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-5">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Teknisyen ağı</p>
          <h2 id="map-title" className="text-h2 font-extrabold text-balance">
            {regionStats.cityCount} ilde, {regionStats.technicianCount}+ aktif teknisyen
          </h2>
          <p className="text-sm leading-relaxed text-ink-soft">
            Kurulum ve servis ağımız Türkiye genelinde yayılıyor. Haritadaki illerin üzerine gelin
            (veya klavyeyle odaklanın); ortalama kurulum süresini ve aktif müşteri sayısını görün.
          </p>

          <dl className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border-soft bg-surface p-3">
              <dt className="text-[11px] text-ink-soft">Aktif müşteri</dt>
              <dd className="mt-1 text-lg font-extrabold text-primary-dark">
                {regionStats.activeCustomers.toLocaleString("tr-TR")}+
              </dd>
            </div>
            <div className="rounded-2xl border border-border-soft bg-surface p-3">
              <dt className="text-[11px] text-ink-soft">Ort. kurulum</dt>
              <dd className="mt-1 text-lg font-extrabold text-primary-dark">24 sa</dd>
            </div>
            <div className="rounded-2xl border border-border-soft bg-surface p-3">
              <dt className="text-[11px] text-ink-soft">Memnuniyet</dt>
              <dd className="mt-1 text-lg font-extrabold text-primary-dark">%98</dd>
            </div>
          </dl>

          <p className="flex items-center gap-1.5 text-xs text-ink-soft">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
            Listede olmayan iller için bölge ekibimiz planlama yapar.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="relative aspect-square">
            <svg
              viewBox="0 0 100 100"
              role="img"
              aria-label="Türkiye teknisyen ağı haritası"
              className="h-full w-full"
            >
              <path
                d={TURKEY_PATH}
                className="fill-primary-soft stroke-primary-light"
                strokeWidth="0.7"
              />
              {regions.map((region) => {
                const isActive = region.id === activeId;
                return (
                  <g
                    key={region.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`${region.name}: ${region.technicianCount} aktif teknisyen, ortalama kurulum ${region.avgInstallHours} saat`}
                    onMouseEnter={() => setActiveId(region.id)}
                    onFocus={() => setActiveId(region.id)}
                    onClick={() => setActiveId(region.id)}
                    className="cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <circle
                      cx={region.x}
                      cy={region.y}
                      r={isActive ? 4.4 : 3.2}
                      className={cn(
                        "transition-all",
                        isActive ? "fill-primary" : "fill-primary/60 hover:fill-primary",
                      )}
                    />
                    <circle cx={region.x} cy={region.y} r="1.2" fill="white" pointerEvents="none" />
                  </g>
                );
              })}
            </svg>

            {active ? (
              <div
                role="tooltip"
                className="pointer-events-none absolute z-10 w-48 -translate-x-1/2 -translate-y-[115%] rounded-xl border border-border-soft bg-surface p-3 text-left shadow-xl"
                style={{ left: `${active.x}%`, top: `${active.y}%` }}
              >
                <p className="text-sm font-bold">{active.name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
                  <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                  {active.technicianCount} aktif teknisyen
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Ort. kurulum {active.avgInstallHours} saat
                </p>
                <p className="mt-0.5 text-xs font-semibold text-primary-dark">
                  {active.activeCustomers.toLocaleString("tr-TR")}+ aktif müşteri
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
