import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 1.234,56 ₺ biçiminde TRY fiyat metni. */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

/** UTC zaman damgasını Europe/Istanbul saatinde okunur metne çevirir. */
export function formatDateTimeTR(value: string | Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function formatDateTR(value: string | Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function formatTimeTR(value: string | Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export const DAY_MS = 24 * 60 * 60 * 1000;
