import type { HardnessRecord } from "@/lib/types";

/** 81 il için ortalama şebeke suyu sertliği (ppm CaCO3). Kaynak: derlenmiş kamu verileri. */
const PROVINCE_PPM: Record<string, number> = {
  Adana: 210,
  Adıyaman: 240,
  Afyonkarahisar: 260,
  Ağrı: 180,
  Aksaray: 280,
  Amasya: 230,
  Ankara: 190,
  Antalya: 250,
  Ardahan: 160,
  Artvin: 120,
  Aydın: 220,
  Balıkesir: 210,
  Bartın: 150,
  Batman: 260,
  Bayburt: 170,
  Bilecik: 200,
  Bingöl: 190,
  Bitlis: 200,
  Bolu: 170,
  Burdur: 250,
  Bursa: 200,
  Çanakkale: 190,
  Çankırı: 270,
  Çorum: 260,
  Denizli: 230,
  Diyarbakır: 250,
  Düzce: 180,
  Edirne: 220,
  Elazığ: 230,
  Erzincan: 200,
  Erzurum: 210,
  Eskişehir: 220,
  Gaziantep: 240,
  Giresun: 140,
  Gümüşhane: 150,
  Hakkari: 180,
  Hatay: 230,
  Iğdır: 200,
  Isparta: 240,
  İstanbul: 180,
  İzmir: 200,
  Kahramanmaraş: 250,
  Karabük: 190,
  Karaman: 260,
  Kars: 190,
  Kastamonu: 200,
  Kayseri: 250,
  Kırıkkale: 260,
  Kırklareli: 210,
  Kırşehir: 270,
  Kilis: 240,
  Kocaeli: 190,
  Konya: 280,
  Kütahya: 230,
  Malatya: 240,
  Manisa: 210,
  Mardin: 250,
  Mersin: 230,
  Muğla: 220,
  Muş: 200,
  Nevşehir: 270,
  Niğde: 260,
  Ordu: 150,
  Osmaniye: 230,
  Rize: 120,
  Sakarya: 190,
  Samsun: 180,
  Siirt: 230,
  Sinop: 170,
  Sivas: 250,
  Şanlıurfa: 270,
  Şırnak: 220,
  Tekirdağ: 210,
  Tokat: 230,
  Trabzon: 140,
  Tunceli: 190,
  Uşak: 240,
  Van: 200,
  Yalova: 180,
  Yozgat: 260,
  Zonguldak: 180,
};

/** Büyük ilçeler için il ortalamasından daha isabetli değerler. */
const DISTRICT_PPM: Record<string, number> = {
  "İstanbul/Kadıköy": 165,
  "İstanbul/Beşiktaş": 175,
  "İstanbul/Şişli": 180,
  "İstanbul/Üsküdar": 170,
  "İstanbul/Bakırköy": 190,
  "Ankara/Çankaya": 185,
  "Ankara/Keçiören": 200,
  "Ankara/Yenimahalle": 195,
  "İzmir/Bornova": 190,
  "İzmir/Karşıyaka": 195,
  "İzmir/Konak": 205,
  "Antalya/Muratpaşa": 255,
  "Antalya/Kepez": 260,
  "Antalya/Konyaaltı": 250,
  "Bursa/Nilüfer": 195,
  "Bursa/Osmangazi": 205,
};

export const provinceNames = Object.keys(PROVINCE_PPM).sort((a, b) => a.localeCompare(b, "tr"));

export const districtsByProvince: Record<string, string[]> = Object.entries(DISTRICT_PPM).reduce<
  Record<string, string[]>
>((acc, [key]) => {
  const [il, ilce] = key.split("/") as [string, string];
  acc[il] = [...(acc[il] ?? []), ilce];
  return acc;
}, {});

export const hardnessRecords: HardnessRecord[] = [
  ...Object.entries(PROVINCE_PPM).map(([il, ppm]) => ({ il, ppm })),
  ...Object.entries(DISTRICT_PPM).map(([key, ppm]) => {
    const [il, ilce] = key.split("/") as [string, string];
    return { il, ilce, ppm };
  }),
];

export { PROVINCE_PPM, DISTRICT_PPM };
