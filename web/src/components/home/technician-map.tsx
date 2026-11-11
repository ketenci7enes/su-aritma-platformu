"use client";

import { useState } from "react";
import { MapPin, Wrench } from "lucide-react";
import { regions, regionStats, regionsByPlate } from "@/lib/data/regions";
import { TURKEY_MAP_VIEWBOX, turkeyProvinces } from "@/lib/data/turkey-provinces.generated";
import { cn } from "@/lib/utils";

const { width: MAP_WIDTH, height: MAP_HEIGHT } = TURKEY_MAP_VIEWBOX;

/**
 * Türkiye teknisyen ağı haritası — 81 il sınırı amCharts geodata'dan (CC BY 4.0)
 * üretilir (`web/scripts/generate-turkey-map.mjs`). Teknisyen verisi olan iller
 * pin ile işaretlenir; klavye ve fare ile seçilebilir. Seçili ilin ayrıntısı
 * haritanın altındaki kartta gösterilir (harita üzerini kapatmaz).
 */
export function TechnicianMap() {
  const [activeId, setActiveId] = useState<string | null>("antalya");
  const active = regions.find((region) => region.id === activeId) ?? null;

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

        <div className="mx-auto w-full max-w-xl">
          <div className="relative" style={{ aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}>
            <svg
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              role="img"
              aria-label="Türkiye teknisyen ağı haritası: 81 il sınırı ve hizmet verilen 12 il"
              className="h-full w-full"
            >
              <g aria-hidden="true">
                {turkeyProvinces.map((province) => {
                  const isActive = province.id === active?.plate;
                  const covered = regionsByPlate.has(province.id);
                  return (
                    <path
                      key={province.id}
                      d={province.d}
                      className={cn(
                        "transition-colors duration-200",
                        isActive
                          ? "fill-primary stroke-primary-dark"
                          : covered
                            ? "fill-primary-light/70 stroke-primary/50 hover:fill-primary/35"
                            : "fill-primary-soft/60 stroke-border-soft hover:fill-primary-light/50",
                      )}
                      strokeWidth={1.2}
                      strokeLinejoin="round"
                    />
                  );
                })}
              </g>

              {regions.map((region) => {
                const province = turkeyProvinces.find((item) => item.id === region.plate);
                if (!province) return null;
                const isActive = region.id === activeId;
                return (
                  <g
                    key={region.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`${region.name}: ${region.technicianCount} aktif teknisyen, ortalama kurulum ${region.avgInstallHours} saat`}
                    aria-pressed={isActive}
                    onMouseEnter={() => setActiveId(region.id)}
                    onFocus={() => setActiveId(region.id)}
                    onClick={() => setActiveId(region.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveId(region.id);
                      }
                    }}
                    className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <circle
                      cx={province.cx}
                      cy={province.cy}
                      r={isActive ? 12 : 9}
                      className={cn(
                        "transition-all",
                        isActive ? "fill-primary-dark" : "fill-primary/80 hover:fill-primary",
                      )}
                    />
                    <circle
                      cx={province.cx}
                      cy={province.cy}
                      r={isActive ? 4.5 : 3.5}
                      fill="white"
                      pointerEvents="none"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div
            aria-live="polite"
            className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl border border-border-soft bg-surface px-4 py-3"
          >
            {active ? (
              <>
                <p className="text-sm font-bold">{active.name}</p>
                <p className="flex items-center gap-1 text-xs text-ink-soft">
                  <Wrench className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {active.technicianCount} aktif teknisyen
                </p>
                <p className="text-xs text-ink-soft">Ort. kurulum {active.avgInstallHours} saat</p>
                <p className="text-xs font-semibold text-primary-dark">
                  {active.activeCustomers.toLocaleString("tr-TR")}+ aktif müşteri
                </p>
              </>
            ) : (
              <p className="text-xs text-ink-soft">
                Bir il seçin; teknisyen ve kurulum bilgisi burada görünür.
              </p>
            )}
          </div>

          <p className="mt-3 text-center text-[10px] text-ink-soft">
            Harita:{" "}
            <a
              href="https://www.amcharts.com/svg-maps/turkey/"
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-2 hover:text-primary"
            >
              amCharts
            </a>{" "}
            (CC BY 4.0)
          </p>
        </div>
      </div>
    </section>
  );
}
