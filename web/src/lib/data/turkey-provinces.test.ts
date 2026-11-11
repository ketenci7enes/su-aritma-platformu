import { describe, expect, it } from "vitest";
import { regions } from "./regions";
import { TURKEY_MAP_VIEWBOX, turkeyProvinces } from "./turkey-provinces.generated";

describe("Türkiye harita verisi", () => {
  it("81 ilin tamamını içerir", () => {
    expect(turkeyProvinces).toHaveLength(81);
  });

  it("il kimlikleri tekil ve ISO 3166-2:TR biçiminde", () => {
    const ids = turkeyProvinces.map((province) => province.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^TR-\d{2}$/);
    }
  });

  it("her ilin boş olmayan path ve geçerli pin çapası vardır", () => {
    for (const province of turkeyProvinces) {
      expect(province.name.length).toBeGreaterThan(0);
      expect(province.d.startsWith("M")).toBe(true);
      expect(province.d.endsWith("Z")).toBe(true);
      expect(province.cx).toBeGreaterThanOrEqual(0);
      expect(province.cx).toBeLessThanOrEqual(TURKEY_MAP_VIEWBOX.width);
      expect(province.cy).toBeGreaterThanOrEqual(0);
      expect(province.cy).toBeLessThanOrEqual(TURKEY_MAP_VIEWBOX.height);
    }
  });

  it("path koordinatları viewBox içinde kalır", () => {
    for (const province of turkeyProvinces) {
      const numbers = province.d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
      const xs = numbers.filter((_, index) => index % 2 === 0);
      const ys = numbers.filter((_, index) => index % 2 === 1);
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(-1);
      expect(Math.max(...xs)).toBeLessThanOrEqual(TURKEY_MAP_VIEWBOX.width + 1);
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(-1);
      expect(Math.max(...ys)).toBeLessThanOrEqual(TURKEY_MAP_VIEWBOX.height + 1);
    }
  });

  it("her teknisyen bölgesi gerçek bir ile eşlenir", () => {
    for (const region of regions) {
      const province = turkeyProvinces.find((item) => item.id === region.plate);
      expect(province, `${region.name} (${region.plate}) haritada yok`).toBeDefined();
    }
  });

  it("bölge verisi adlarıyla eşleşir (plaka kayması yok)", () => {
    for (const region of regions) {
      const province = turkeyProvinces.find((item) => item.id === region.plate);
      const normalize = (value: string) =>
        value
          .toLocaleUpperCase("tr-TR")
          .replaceAll("İ", "I")
          .replaceAll("Â", "A")
          .replaceAll("Û", "U");
      expect(normalize(province!.name)).toContain(normalize(region.name));
    }
  });
});
