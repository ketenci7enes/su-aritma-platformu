/**
 * Türkiye haritası üreteci.
 *
 * Kaynak: amCharts 5 geodata — `turkeyLow` (81 il, Mercator).
 * https://www.amcharts.com/svg-maps/turkey/ — CC BY 4.0, atıf korunmalı.
 *
 * Kullanım:
 *   node scripts/generate-turkey-map.mjs            # CDN'den indirir
 *   node scripts/generate-turkey-map.mjs <kaynak.json>
 *
 * Çıktı: src/lib/data/turkey-provinces.generated.ts
 * (koordinatlar 2 ondalığa yuvarlanır, ardışık tekrarlar atılır → bundle için küçük)
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SOURCE_URL = "https://cdn.amcharts.com/lib/5/geodata/json/turkeyLow.json";
const OUT_FILE = fileURLToPath(
  new URL("../src/lib/data/turkey-provinces.generated.ts", import.meta.url),
);
const VIEWBOX_WIDTH = 1000;
const PADDING = 8;
/** viewBox birimi cinsinden sapma toleransı (≈1 km); gözle fark edilmez, bundle'ı küçültür. */
const SIMPLIFY_TOLERANCE = Number(process.env.TOLERANCE ?? 0.9);

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/** Web Mercator: x = lon, y = ln(tan(π/4 + φ/2)) */
function project([lon, lat]) {
  const x = toRad(lon);
  const y = Math.log(Math.tan(Math.PI / 4 + toRad(lat) / 2));
  return [x, -y];
}

async function loadGeojson() {
  const arg = process.argv[2];
  if (arg) {
    return JSON.parse(await readFile(arg, "utf8"));
  }
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Kaynak indirilemedi: ${response.status} ${SOURCE_URL}`);
  }
  return response.json();
}

function ringsOf(feature) {
  const { type, coordinates } = feature.geometry;
  return type === "Polygon" ? coordinates : coordinates.flat();
}

function simplifyRing(ring) {
  const round = (value) => Math.round(value * 100) / 100;
  const out = [];
  for (const point of ring) {
    const lon = round(point[0]);
    const lat = round(point[1]);
    const last = out[out.length - 1];
    if (last && last[0] === lon && last[1] === lat) continue;
    out.push([lon, lat]);
  }
  // Ring'i kapat (GeoJSON kapalı gelir; tekrar nokta SVG'de gereksiz).
  if (out.length > 1) {
    const first = out[0];
    const last = out[out.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) out.pop();
  }
  return out;
}

/** Ramer–Douglas–Peucker: görsel olarak fark edilmeyen noktaları atar. */
function simplifyPath(points, tolerance) {
  if (points.length <= 3) return points;

  const [first] = points;
  const last = points[points.length - 1];
  let maxDistance = 0;
  let index = 0;

  for (let i = 1; i < points.length - 1; i += 1) {
    const [x, y] = points[i];
    const [x1, y1] = first;
    const [x2, y2] = last;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    const t =
      lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSq));
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    const distance = Math.hypot(x - px, y - py);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance <= tolerance) return [first, last];

  return [
    ...simplifyPath(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplifyPath(points.slice(index), tolerance),
  ];
}

/** Alanı en büyük ringi döndürür (adaları atlayıp ana kara parçasını seçmek için). */
function largestRing(rings) {
  let best = rings[0];
  let bestArea = -1;
  for (const ring of rings) {
    let area = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    }
    const abs = Math.abs(area / 2);
    if (abs > bestArea) {
      bestArea = abs;
      best = ring;
    }
  }
  return best;
}

function computeBbox(projected) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ring of projected) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY };
}

async function main() {
  const geojson = await loadGeojson();

  // 1) Geometriyi sadeleştir, 2) Mercator'a izdüşür, 3) sınır kutusunu izdüşürülmüş
  // noktalardan hesapla — derece ve projeksiyon birimlerini karıştırmamak kritik.
  const provinces = geojson.features.map((feature) => {
    const rings = ringsOf(feature)
      .map(simplifyRing)
      .filter((ring) => ring.length >= 3)
      .map((ring) => ring.map(project));
    return {
      id: feature.properties?.id ?? feature.id,
      name: feature.properties?.name ?? feature.properties?.NAME ?? feature.id,
      rings,
      anchorRing: largestRing(rings),
    };
  });

  const allRings = provinces.flatMap((province) => province.rings);
  const bbox = computeBbox(allRings);
  const scale = (VIEWBOX_WIDTH - PADDING * 2) / (bbox.maxX - bbox.minX);
  const height = Math.round((bbox.maxY - bbox.minY) * scale + PADDING * 2);

  const mapPoint = ([x, y]) => [
    Math.round(((x - bbox.minX) * scale + PADDING) * 10) / 10,
    Math.round(((y - bbox.minY) * scale + PADDING) * 10) / 10,
  ];

  let emittedPoints = 0;

  const output = provinces
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((province) => {
      const d = province.rings
        .map((ring) => {
          const points = simplifyPath(ring.map(mapPoint), SIMPLIFY_TOLERANCE);
          emittedPoints += points.length;
          return `M${points.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
        })
        .join("");
      const anchor = province.anchorRing.map(mapPoint);
      // Etiket/pin çapası: ana kara parçasının sınır kutusu merkezi.
      const xs = anchor.map(([x]) => x);
      const ys = anchor.map(([, y]) => y);
      const cx = Math.round(((Math.min(...xs) + Math.max(...xs)) / 2) * 10) / 10;
      const cy = Math.round(((Math.min(...ys) + Math.max(...ys)) / 2) * 10) / 10;
      return { id: province.id, name: province.name, d, cx, cy };
    });

  const header = `/**
 * OTOMATİK ÜRETİLDİ — elle düzenlemeyin.
 * Üretici: web/scripts/generate-turkey-map.mjs
 * Kaynak: amCharts 5 geodata "turkeyLow" — https://www.amcharts.com/svg-maps/turkey/
 * Lisans: CC BY 4.0 (atıf: "Map by amcharts.com" arayüzde korunur).
 */
`;

  const body = `export interface TurkeyProvince {
  id: string;
  name: string;
  /** SVG path, viewBox 0 0 ${VIEWBOX_WIDTH} ${height} içinde. */
  d: string;
  /** Ana kara parçasının sınır kutusu merkezi (pin çapası). */
  cx: number;
  cy: number;
}

export const TURKEY_MAP_VIEWBOX = { width: ${VIEWBOX_WIDTH}, height: ${height} } as const;

export const turkeyProvinces: readonly TurkeyProvince[] = [
${output
  .map(
    (province) =>
      `  { id: ${JSON.stringify(province.id)}, name: ${JSON.stringify(province.name)}, d: ${JSON.stringify(
        province.d,
      )}, cx: ${province.cx}, cy: ${province.cy} },`,
  )
  .join("\n")}
];
`;

  await writeFile(OUT_FILE, header + body, "utf8");

  const bytes = Buffer.byteLength(header + body, "utf8");
  console.log(
    `✓ ${output.length} il, ${emittedPoints} çizim noktası, viewBox ${VIEWBOX_WIDTH}x${height}, ${(bytes / 1024).toFixed(1)} KB → ${path.relative(process.cwd(), OUT_FILE)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
