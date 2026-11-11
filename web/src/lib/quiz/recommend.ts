import { DISTRICT_PPM, PROVINCE_PPM } from "@/lib/data/hardness";
import { devices } from "@/lib/data/products";
import type { HardnessLevel, Product } from "@/lib/types";

export interface QuizInput {
  il: string;
  ilce?: string;
  people: number;
}

export interface Recommendation {
  product: Product;
  hardness: {
    ppm: number;
    level: HardnessLevel;
    assumed: boolean;
  };
  reasons: string[];
}

const DEFAULT_PPM = 110; // veri yoksa "orta sertlik" varsayımı

const LEVEL_LABELS: Record<HardnessLevel, string> = {
  soft: "yumuşak",
  medium: "orta",
  hard: "sert",
  very_hard: "çok sert",
};

/** ppm → enum. Sınırlar: ≤60 yumuşak, ≤120 orta, ≤180 sert, üzeri çok sert. */
export function classifyHardness(ppm: number): HardnessLevel {
  if (ppm <= 60) return "soft";
  if (ppm <= 120) return "medium";
  if (ppm <= 180) return "hard";
  return "very_hard";
}

/** Sertlik seviyesine göre gereken minimum arıtma aşaması. */
function minStagesFor(level: HardnessLevel): number {
  if (level === "soft" || level === "medium") return 4;
  if (level === "hard") return 5;
  return 6;
}

/** Kişi sayısına göre gereken minimum günlük kapasite (L). */
export function requiredCapacity(people: number): number {
  const count = Math.max(1, Math.floor(people));
  if (count <= 2) return 190;
  if (count <= 4) return 285;
  if (count <= 6) return 380;
  if (count <= 9) return 570;
  return 1500;
}

function lookupHardness(
  il: string,
  ilce?: string,
): { ppm: number; assumed: boolean; scope: "district" | "province" | "default" } {
  if (ilce) {
    const district = DISTRICT_PPM[`${il}/${ilce}`];
    if (district !== undefined) return { ppm: district, assumed: false, scope: "district" };
  }
  const province = PROVINCE_PPM[il];
  if (province !== undefined) {
    // İlçe verisi yok ama il ortalaması var: daha isabetli olan il verisini kullan.
    return { ppm: province, assumed: Boolean(ilce), scope: "province" };
  }
  return { ppm: DEFAULT_PPM, assumed: true, scope: "default" };
}

export function recommendDevice(input: QuizInput, catalog: Product[] = devices): Recommendation {
  const people = Math.max(1, Math.floor(input.people || 1));
  const { ppm, assumed, scope } = lookupHardness(input.il, input.ilce);
  const level = classifyHardness(ppm);
  const minStages = minStagesFor(level);
  const capacity = requiredCapacity(people);

  const candidates = catalog
    .filter((product) => product.category === "device")
    .filter(
      (product) => (product.capacityLpd ?? 0) >= capacity && (product.stages ?? 0) >= minStages,
    )
    .sort((a, b) => (a.capacityLpd ?? 0) - (b.capacityLpd ?? 0));

  const fallback = [...catalog]
    .filter((product) => product.category === "device")
    .sort((a, b) => (b.capacityLpd ?? 0) - (a.capacityLpd ?? 0))[0];

  const product = candidates[0] ?? fallback;
  if (!product) {
    throw new Error("Önerilecek cihaz bulunamadı");
  }

  const location = input.ilce ? `${input.il}/${input.ilce}` : input.il;
  const reasons = [
    `${location} için ortalama su sertliği ${ppm} ppm (${LEVEL_LABELS[level]} su).`,
    `${people} kişilik kullanım için en az ${capacity} L/gün kapasite hedeflendi.`,
    `${product.name}, ${product.stages ?? "-"} aşamalı filtrasyon ve ${product.capacityLpd ?? "-"} L/gün kapasitesiyle bu ihtiyacı karşılıyor.`,
  ];

  if (assumed) {
    reasons.unshift(
      scope === "province"
        ? "Bu ilçe için ayrı sertlik verisi yok; il ortalaması kullanıldı. Sonuç size en yakın değeri yansıtır."
        : "Bölgeniz için kayıtlı sertlik verisi bulunamadı; orta sertlik varsaydık. Sonuç size en yakın değeri yansıtır.",
    );
  }

  return {
    product,
    hardness: { ppm, level, assumed },
    reasons,
  };
}
