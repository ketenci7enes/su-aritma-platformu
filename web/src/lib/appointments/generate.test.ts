import { describe, expect, it } from "vitest";
import { generateSlots } from "./generate";

const technicians = [
  { id: "t1", name: "Ahmet Usta" },
  { id: "t2", name: "Mehmet Usta" },
];

const NOW = new Date("2026-06-01T05:00:00.000Z"); // Pazartesi 08:00 Istanbul

describe("generateSlots", () => {
  it("her teknisyen için günlük 4 saat üretir", () => {
    const slots = generateSlots({
      now: NOW,
      from: new Date("2026-06-01T00:00:00.000Z"),
      days: 1,
      technicians,
    });
    expect(slots).toHaveLength(8);
  });

  it("hafta sonu slotu üretmez", () => {
    const slots = generateSlots({
      now: NOW,
      from: new Date("2026-06-06T00:00:00.000Z"), // Cumartesi
      days: 1,
      technicians,
    });
    expect(slots).toHaveLength(0);
  });

  it("geçmiş saatleri atlar", () => {
    const slots = generateSlots({
      now: new Date("2026-06-01T12:00:00.000Z"), // Pazartesi 15:00 Istanbul
      from: new Date("2026-06-01T00:00:00.000Z"),
      days: 1,
      technicians,
    });
    // 16:00 slotu gelecekte; 09:00/11:00/14:00 geçmiş
    expect(slots).toHaveLength(2);
    expect(
      slots.every(
        (slot) => new Date(slot.start).getTime() > new Date("2026-06-01T12:00:00.000Z").getTime(),
      ),
    ).toBe(true);
  });

  it("slot kimlikleri benzersizdir", () => {
    const slots = generateSlots({
      now: NOW,
      from: new Date("2026-06-01T00:00:00.000Z"),
      days: 5,
      technicians,
    });
    const ids = new Set(slots.map((slot) => slot.id));
    expect(ids.size).toBe(slots.length);
  });

  it("09:00 Istanbul saatini doğru UTC'ye çevirir", () => {
    const slots = generateSlots({
      now: NOW,
      from: new Date("2026-06-01T00:00:00.000Z"),
      days: 1,
      technicians,
    });
    expect(slots[0]?.start).toBe("2026-06-01T06:00:00.000Z");
  });

  it("slot sonu bir saat sonradır", () => {
    const slots = generateSlots({
      now: NOW,
      from: new Date("2026-06-01T00:00:00.000Z"),
      days: 1,
      technicians,
    });
    const first = slots[0]!;
    expect(new Date(first.end).getTime() - new Date(first.start).getTime()).toBe(60 * 60 * 1000);
  });
});
