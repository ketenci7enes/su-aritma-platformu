import { describe, expect, it } from "vitest";
import { classifyHardness, recommendDevice } from "./recommend";
import { devices } from "@/lib/data/products";

describe("classifyHardness", () => {
  it("sınır değerlerini doğru sınıflandırır", () => {
    expect(classifyHardness(60)).toBe("soft");
    expect(classifyHardness(61)).toBe("medium");
    expect(classifyHardness(120)).toBe("medium");
    expect(classifyHardness(121)).toBe("hard");
    expect(classifyHardness(180)).toBe("hard");
    expect(classifyHardness(181)).toBe("very_hard");
  });
});

describe("recommendDevice", () => {
  it("yumuşak suda az kişilik hane için kompakt cihaz önerir", () => {
    const result = recommendDevice({ il: "Rize", people: 2 });
    expect(result.product.slug).toBe("aquapure-slim-4");
    expect(result.hardness.level).toBe("medium");
    expect(result.hardness.assumed).toBe(false);
  });

  it("yüksek sertlikte minimum 6 aşama ister", () => {
    const result = recommendDevice({ il: "Antalya", ilce: "Muratpaşa", people: 3 });
    expect(result.product.slug).toBe("aquapure-pro-6");
    expect(result.hardness.level).toBe("very_hard");
    expect(result.hardness.ppm).toBe(255);
  });

  it("sert suda 2 kişilik hane için 5 aşamalı modele yükseltir", () => {
    const result = recommendDevice({ il: "İstanbul", ilce: "Kadıköy", people: 2 });
    expect(result.product.slug).toBe("aquapure-home-5");
    expect(result.hardness.level).toBe("hard");
  });

  it("kalabalık hanede kapasiteye göre büyütür", () => {
    const result = recommendDevice({ il: "Ankara", people: 8 });
    expect(result.product.slug).toBe("aquapure-max-7");
  });

  it("çok kalabalık kullanımda HORECA modeline geçer", () => {
    const result = recommendDevice({ il: "Konya", people: 14 });
    expect(result.product.slug).toBe("aquapure-horeca-8");
  });

  it("bilinmeyen ilçede il ortalamasına düşer ve not döner", () => {
    const result = recommendDevice({ il: "Antalya", ilce: "Bilinmeyen", people: 4 });
    expect(result.hardness.assumed).toBe(true);
    expect(result.hardness.ppm).toBe(250);
    expect(result.hardness.level).toBe("very_hard");
    expect(result.reasons.join(" ")).toContain("ilçe");
    expect(result.product.category).toBe("device");
  });

  it("bilinmeyen ilde orta sertlik varsayar ve çökmez", () => {
    const result = recommendDevice({ il: "Atlantis", people: 3 });
    expect(result.product.category).toBe("device");
    expect(result.hardness.assumed).toBe(true);
    expect(result.hardness.level).toBe("medium");
    expect(result.reasons.join(" ")).toContain("varsay");
  });

  it("kişi sayısını en az 1 kabul eder", () => {
    const result = recommendDevice({ il: "Rize", people: 0 });
    expect(result.product.capacityLpd).toBeGreaterThan(0);
    expect(result.product.slug).toBe("aquapure-slim-4");
  });

  it("gerekçe metni sertliği ve kapasiteyi açıklar", () => {
    const result = recommendDevice({ il: "Konya", people: 5 });
    expect(result.reasons.length).toBeGreaterThanOrEqual(2);
    expect(result.reasons.join(" ")).toContain("Konya");
  });

  it("boş katalogda hata fırlatır", () => {
    expect(() => recommendDevice({ il: "Rize", people: 2 }, [])).toThrow(
      "Önerilecek cihaz bulunamadı",
    );
  });

  it("katalogdan en küçük uygun cihazı seçer", () => {
    const result = recommendDevice({ il: "Rize", people: 3 }, devices);
    expect(result.product.slug).toBe("aquapure-home-5");
  });
});
