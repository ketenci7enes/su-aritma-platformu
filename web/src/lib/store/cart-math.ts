import type { CartLine } from "@/lib/types";

export type { CartLine };

function toCents(value: number): number {
  return Math.round(value * 100);
}

/** Sepet ara toplamı — kayan nokta hatası üretmeden kuruş bazında. */
export function cartSubtotal(lines: readonly CartLine[]): number {
  const cents = lines.reduce((sum, line) => sum + toCents(line.price) * line.qty, 0);
  return cents / 100;
}

export function cartCount(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}
