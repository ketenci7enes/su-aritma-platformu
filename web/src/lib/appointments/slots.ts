export const SLOT_HOLD_MINUTES = 10;

export interface SlotRecord {
  id: string;
  technicianId: string;
  technicianName: string;
  start: string;
  end: string;
  status: "free" | "held" | "booked";
  heldUntil?: string;
  heldBy?: string;
}

export interface MutationResult {
  ok: boolean;
  slots: SlotRecord[];
  error?: string;
}

function isHoldActive(slot: SlotRecord, now: Date): boolean {
  if (slot.status !== "held" || !slot.heldUntil) return false;
  return new Date(slot.heldUntil).getTime() > now.getTime();
}

export function isSlotAvailable(slot: SlotRecord, userId: string, now: Date): boolean {
  if (slot.status === "free") return true;
  if (slot.status === "booked") return false;
  if (slot.heldBy === userId) return true;
  return !isHoldActive(slot, now);
}

/** Slotu 10 dakikalığına atomik olarak tutar (demo modda dizi üzerinde). */
export function holdSlot(
  slots: readonly SlotRecord[],
  slotId: string,
  userId: string,
  now: Date,
): MutationResult {
  const index = slots.findIndex((slot) => slot.id === slotId);
  if (index === -1) return { ok: false, slots: [...slots], error: "Slot bulunamadı" };

  const target = slots[index]!;
  if (!isSlotAvailable(target, userId, now)) {
    return {
      ok: false,
      slots: [...slots],
      error: "Slot dolu veya başka kullanıcı tarafından tutuldu",
    };
  }

  const next = slots.map((slot, i) =>
    i === index
      ? {
          ...slot,
          status: "held" as const,
          heldBy: userId,
          heldUntil: new Date(now.getTime() + SLOT_HOLD_MINUTES * 60_000).toISOString(),
        }
      : slot,
  );

  return { ok: true, slots: next };
}

/** Hold sahibinin 10 dk içinde yaptığı rezervasyonu kesinleştirir. */
export function confirmSlot(
  slots: readonly SlotRecord[],
  slotId: string,
  userId: string,
  now: Date,
): MutationResult {
  const index = slots.findIndex((slot) => slot.id === slotId);
  if (index === -1) return { ok: false, slots: [...slots], error: "Slot bulunamadı" };

  const target = slots[index]!;
  const valid =
    target.status === "held" &&
    target.heldBy === userId &&
    Boolean(target.heldUntil) &&
    new Date(target.heldUntil!).getTime() > now.getTime();

  if (!valid) {
    return {
      ok: false,
      slots: [...slots],
      error: "Rezervasyon süresi doldu veya slot size ait değil",
    };
  }

  const next = slots.map((slot, i) =>
    i === index ? { ...slot, status: "booked" as const, heldUntil: undefined } : slot,
  );

  return { ok: true, slots: next };
}

/** Süresi dolmuş hold'ları serbest bırakır. */
export function releaseExpiredHolds(slots: readonly SlotRecord[], now: Date): SlotRecord[] {
  return slots.map((slot) =>
    slot.status === "held" && !isHoldActive(slot, now)
      ? { ...slot, status: "free" as const, heldBy: undefined, heldUntil: undefined }
      : slot,
  );
}
