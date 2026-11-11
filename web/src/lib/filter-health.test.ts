import { describe, expect, it } from "vitest";
import { computeFilterHealth, daysElapsedInIstanbul } from "./filter-health";

describe("computeFilterHealth", () => {
  const installed = "2026-01-01T00:00:00.000Z";

  it("10 gün sonra kalan ömrü hesaplar", () => {
    const health = computeFilterHealth(installed, new Date("2026-01-11T00:00:00.000Z"));
    expect(health.daysElapsed).toBe(10);
    expect(health.daysRemaining).toBe(170);
    expect(health.percentRemaining).toBeCloseTo(94.4, 1);
    expect(health.needsReorder).toBe(false);
    expect(health.status).toBe("healthy");
  });

  it("170. günde yeniden sipariş uyarısı verir", () => {
    const health = computeFilterHealth(installed, new Date("2026-06-20T00:00:00.000Z"));
    expect(health.daysElapsed).toBe(170);
    expect(health.needsReorder).toBe(true);
    expect(health.status).toBe("soon");
  });

  it("169. günde yeniden sipariş tetiklenmez ama uyarı bandındadır", () => {
    const health = computeFilterHealth(installed, new Date("2026-06-19T00:00:00.000Z"));
    expect(health.needsReorder).toBe(false);
    expect(health.status).toBe("soon");
  });

  it("180. günde ömür biter ve yüzde 0 olur", () => {
    const health = computeFilterHealth(installed, new Date("2026-06-30T00:00:00.000Z"));
    expect(health.daysElapsed).toBe(180);
    expect(health.daysRemaining).toBe(0);
    expect(health.percentRemaining).toBe(0);
    expect(health.status).toBe("due");
  });

  it("ömür dolduktan sonra negatife düşmez, 0'da kalır", () => {
    const health = computeFilterHealth(installed, new Date("2026-09-01T00:00:00.000Z"));
    expect(health.daysRemaining).toBe(0);
    expect(health.percentRemaining).toBe(0);
    expect(health.status).toBe("due");
  });

  it("Europe/Istanbul gün sınırına göre hesap yapar", () => {
    // 21:30 UTC = ertesi gün 00:30 Istanbul
    const health = computeFilterHealth(
      "2026-01-01T21:30:00.000Z",
      new Date("2026-01-02T20:30:00.000Z"),
    );
    expect(health.daysElapsed).toBe(0);
  });

  it("yüzde 20 altına düşünce 'soon' durumuna geçer", () => {
    const health = computeFilterHealth(installed, new Date("2026-05-29T00:00:00.000Z"));
    expect(health.percentRemaining).toBeCloseTo(17.8, 1);
    expect(health.status).toBe("soon");
  });
});

describe("daysElapsedInIstanbul", () => {
  it("UTC gece yarısını Istanbul takvim gününe çevirir", () => {
    expect(
      daysElapsedInIstanbul(
        new Date("2026-01-01T21:30:00.000Z"),
        new Date("2026-01-02T20:30:00.000Z"),
      ),
    ).toBe(0);
    expect(
      daysElapsedInIstanbul(
        new Date("2026-01-01T21:30:00.000Z"),
        new Date("2026-01-03T20:30:00.000Z"),
      ),
    ).toBe(1);
  });
});
