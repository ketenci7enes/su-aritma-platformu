import { describe, expect, it } from "vitest";
import {
  confirmSlot,
  holdSlot,
  isSlotAvailable,
  releaseExpiredHolds,
  type SlotRecord,
} from "./slots";

const NOW = new Date("2026-06-01T10:00:00.000Z");

function slot(overrides: Partial<SlotRecord> = {}): SlotRecord {
  return {
    id: "s1",
    technicianId: "t1",
    technicianName: "Ahmet Usta",
    start: "2026-06-02T09:00:00.000Z",
    end: "2026-06-02T10:00:00.000Z",
    status: "free",
    ...overrides,
  };
}

describe("slot kilidi", () => {
  it("boş slot kullanılabilir", () => {
    expect(isSlotAvailable(slot(), "u1", NOW)).toBe(true);
  });

  it("booked slot kullanılamaz", () => {
    expect(isSlotAvailable(slot({ status: "booked" }), "u1", NOW)).toBe(false);
  });

  it("başkasının aktif hold'u kullanılamaz", () => {
    const held = slot({
      status: "held",
      heldBy: "u2",
      heldUntil: "2026-06-01T10:05:00.000Z",
    });
    expect(isSlotAvailable(held, "u1", NOW)).toBe(false);
  });

  it("süresi dolmuş hold yeniden kullanılabilir", () => {
    const expired = slot({
      status: "held",
      heldBy: "u2",
      heldUntil: "2026-06-01T09:55:00.000Z",
    });
    expect(isSlotAvailable(expired, "u1", NOW)).toBe(true);
  });

  it("iki eşzamanlı istekten yalnızca biri slotu alır", () => {
    const first = holdSlot([slot()], "s1", "u1", NOW);
    expect(first.ok).toBe(true);

    const second = holdSlot(first.slots, "s1", "u2", NOW);
    expect(second.ok).toBe(false);
    expect(second.error).toContain("dolu");
  });

  it("hold 10 dakika TTL yazar", () => {
    const result = holdSlot([slot()], "s1", "u1", NOW);
    expect(result.slots[0]?.heldUntil).toBe("2026-06-01T10:10:00.000Z");
    expect(result.slots[0]?.heldBy).toBe("u1");
  });

  it("hold sahibi süresi içinde onaylayabilir", () => {
    const held = holdSlot([slot()], "s1", "u1", NOW);
    const confirmed = confirmSlot(held.slots, "s1", "u1", new Date("2026-06-01T10:09:00.000Z"));
    expect(confirmed.ok).toBe(true);
    expect(confirmed.slots[0]?.status).toBe("booked");
  });

  it("başkası onaylayamaz", () => {
    const held = holdSlot([slot()], "s1", "u1", NOW);
    const confirmed = confirmSlot(held.slots, "s1", "u2", NOW);
    expect(confirmed.ok).toBe(false);
  });

  it("süresi dolmuş hold onaylanamaz", () => {
    const held = holdSlot([slot()], "s1", "u1", NOW);
    const confirmed = confirmSlot(held.slots, "s1", "u1", new Date("2026-06-01T10:11:00.000Z"));
    expect(confirmed.ok).toBe(false);
  });

  it("süresi dolmuş hold'ları temizler", () => {
    const slots = [
      slot({ id: "a", status: "held", heldBy: "u1", heldUntil: "2026-06-01T09:00:00.000Z" }),
      slot({ id: "b", status: "held", heldBy: "u2", heldUntil: "2026-06-01T11:00:00.000Z" }),
      slot({ id: "c", status: "booked" }),
    ];
    const released = releaseExpiredHolds(slots, NOW);
    expect(released[0]?.status).toBe("free");
    expect(released[1]?.status).toBe("held");
    expect(released[2]?.status).toBe("booked");
  });

  it("olmayan slot için hata döner", () => {
    const result = holdSlot([slot()], "yok", "u1", NOW);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("bulunamadı");
  });
});
