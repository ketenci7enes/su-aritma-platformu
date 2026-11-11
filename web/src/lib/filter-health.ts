import { DAY_MS } from "@/lib/utils";

const ISTANBUL = "Europe/Istanbul";
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ISTANBUL,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function istanbulDayNumber(date: Date): number {
  const parts = formatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(get("year"), get("month") - 1, get("day")) / DAY_MS;
}

/** İki zaman damgası arasındaki takvim günü farkı — Europe/Istanbul sınırına göre. */
export function daysElapsedInIstanbul(from: Date, to: Date): number {
  return Math.max(0, Math.floor(istanbulDayNumber(to) - istanbulDayNumber(from)));
}

export interface FilterHealth {
  installedAt: Date;
  dueAt: Date;
  daysElapsed: number;
  daysRemaining: number;
  percentRemaining: number;
  needsReorder: boolean;
  status: "healthy" | "soon" | "due";
}

export const FILTER_LIFETIME_DAYS = 180;
export const FILTER_REORDER_DAY = 170;

/**
 * Filtre sağlığı: kurulumdan itibaren 180 gün ömür.
 * - %20'nin altı → "soon" (uyarı)
 * - 170. gün → needsReorder (abonelik tetiği)
 * - 180. gün → "due"
 */
export function computeFilterHealth(
  installedAt: string | Date,
  now: Date = new Date(),
  lifetimeDays: number = FILTER_LIFETIME_DAYS,
  reorderDay: number = FILTER_REORDER_DAY,
): FilterHealth {
  const installed = typeof installedAt === "string" ? new Date(installedAt) : installedAt;
  const daysElapsed = daysElapsedInIstanbul(installed, now);
  const daysRemaining = Math.max(0, lifetimeDays - daysElapsed);
  const percentRemaining = Math.round((daysRemaining / lifetimeDays) * 1000) / 10;

  const status: FilterHealth["status"] =
    daysRemaining === 0 ? "due" : percentRemaining < 20 ? "soon" : "healthy";

  return {
    installedAt: installed,
    dueAt: new Date(installed.getTime() + lifetimeDays * DAY_MS),
    daysElapsed,
    daysRemaining,
    percentRemaining,
    needsReorder: daysElapsed >= reorderDay,
    status,
  };
}
