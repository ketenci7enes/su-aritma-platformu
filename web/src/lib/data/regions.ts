import type { Region } from "@/lib/types";

/**
 * Teknisyen ağı verisi. Harita konumu `plate` (ISO 3166-2:TR) üzerinden
 * `turkey-provinces.generated.ts` il geometrisinden türetilir; elle
 * koordinat tutulmaz.
 */
export const regions: Region[] = [
  {
    id: "istanbul",
    name: "İstanbul",
    plate: "TR-34",
    technicianCount: 34,
    avgInstallHours: 18,
    activeCustomers: 4820,
  },
  {
    id: "ankara",
    name: "Ankara",
    plate: "TR-06",
    technicianCount: 19,
    avgInstallHours: 22,
    activeCustomers: 2610,
  },
  {
    id: "izmir",
    name: "İzmir",
    plate: "TR-35",
    technicianCount: 16,
    avgInstallHours: 20,
    activeCustomers: 2140,
  },
  {
    id: "antalya",
    name: "Antalya",
    plate: "TR-07",
    technicianCount: 12,
    avgInstallHours: 24,
    activeCustomers: 1450,
  },
  {
    id: "bursa",
    name: "Bursa",
    plate: "TR-16",
    technicianCount: 11,
    avgInstallHours: 21,
    activeCustomers: 1380,
  },
  {
    id: "konya",
    name: "Konya",
    plate: "TR-42",
    technicianCount: 9,
    avgInstallHours: 26,
    activeCustomers: 1120,
  },
  {
    id: "adana",
    name: "Adana",
    plate: "TR-01",
    technicianCount: 8,
    avgInstallHours: 25,
    activeCustomers: 980,
  },
  {
    id: "gaziantep",
    name: "Gaziantep",
    plate: "TR-27",
    technicianCount: 7,
    avgInstallHours: 28,
    activeCustomers: 860,
  },
  {
    id: "trabzon",
    name: "Trabzon",
    plate: "TR-61",
    technicianCount: 6,
    avgInstallHours: 30,
    activeCustomers: 620,
  },
  {
    id: "diyarbakir",
    name: "Diyarbakır",
    plate: "TR-21",
    technicianCount: 6,
    avgInstallHours: 30,
    activeCustomers: 590,
  },
  {
    id: "samsun",
    name: "Samsun",
    plate: "TR-55",
    technicianCount: 6,
    avgInstallHours: 27,
    activeCustomers: 640,
  },
  {
    id: "eskisehir",
    name: "Eskişehir",
    plate: "TR-26",
    technicianCount: 5,
    avgInstallHours: 23,
    activeCustomers: 510,
  },
];

export const regionStats = {
  cityCount: 81,
  technicianCount: regions.reduce((sum, region) => sum + region.technicianCount, 0),
  activeCustomers: regions.reduce((sum, region) => sum + region.activeCustomers, 0),
};

/** Plaka kodu → aktif il kaydı (harita vurgusu için). */
export const regionsByPlate = new Map(regions.map((region) => [region.plate, region]));
