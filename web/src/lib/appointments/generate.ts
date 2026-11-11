import type { SlotRecord } from "./slots";

const ISTANBUL = "Europe/Istanbul";
const HOURS = [9, 11, 14, 16];
// Türkiye 2016'dan beri sabit UTC+3 kullanır.
const ISTANBUL_OFFSET_HOURS = 3;

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ISTANBUL,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});

export interface TechnicianOption {
  id: string;
  name: string;
}

function istanbulParts(date: Date): { y: number; m: number; d: number; weekday: string } {
  const parts = partsFormatter.formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
    weekday: get("weekday"),
  };
}

/**
 * Verilen tarihten itibaren iş günleri için teknisyen slotları üretir.
 * Saatler Europe/Istanbul 09:00, 11:00, 14:00, 16:00; her slot 1 saat.
 */
export function generateSlots({
  now,
  from,
  days,
  technicians,
}: {
  now: Date;
  from: Date;
  days: number;
  technicians: TechnicianOption[];
}): SlotRecord[] {
  const slots: SlotRecord[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const dayCursor = new Date(from.getTime() + offset * 24 * 60 * 60 * 1000);
    const { y, m, d, weekday } = istanbulParts(dayCursor);
    if (weekday === "Sat" || weekday === "Sun") continue;

    for (const hour of HOURS) {
      const startMs = Date.UTC(y, m - 1, d, hour - ISTANBUL_OFFSET_HOURS, 0, 0);
      if (startMs <= now.getTime()) continue;

      const start = new Date(startMs);
      const end = new Date(startMs + 60 * 60 * 1000);

      for (const technician of technicians) {
        slots.push({
          id: `${technician.id}-${start.toISOString()}`,
          technicianId: technician.id,
          technicianName: technician.name,
          start: start.toISOString(),
          end: end.toISOString(),
          status: "free",
        });
      }
    }
  }

  return slots.sort((a, b) => a.start.localeCompare(b.start));
}

export const PANEL_TECHNICIANS: TechnicianOption[] = [
  { id: "tech-ahmet", name: "Ahmet Yılmaz" },
  { id: "tech-mehmet", name: "Mehmet Demir" },
  { id: "tech-ayse", name: "Ayşe Kaya" },
];
