/**
 * Generates src/pjamm/country-zones.ts from the Natural Earth 1:50m admin-0
 * countries dataset (public domain), pinned to a release tag so output is
 * reproducible. Zone ids and names come from the PJAMM sitemap. Each zone gets
 * one bounding box per country polygon (mainland plus outlying islands), padded
 * and merged so overseas territories like the Canary Islands or Réunion stay
 * covered without one giant box spanning the globe.
 *
 * Run: bun src/pjamm/generate-zones.ts
 */

import type { BoundingBox } from "./types";

const DATASET_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson";

const OUTPUT_PATH = new URL("country-zones.ts", import.meta.url).pathname;

const PAD_DEGREES = 1;
const MAX_BOXES_PER_ZONE = 6;

/**
 * PJAMM country zone pages, ids and names from https://pjammcycling.com/sitemap.xml.
 * `admin` overrides the name when Natural Earth's ADMIN property differs.
 */
const ZONES: { id: number; name: string; admin?: string }[] = [
  { id: 1, name: "United States", admin: "United States of America" },
  { id: 37, name: "Italy" },
  { id: 61, name: "France" },
  { id: 62, name: "United Kingdom" },
  { id: 64, name: "Switzerland" },
  { id: 65, name: "Austria" },
  { id: 66, name: "Spain" },
  { id: 79, name: "Germany" },
  { id: 140, name: "Canada" },
  { id: 146, name: "Croatia" },
  { id: 193, name: "Norway" },
  { id: 196, name: "Chile" },
  { id: 200, name: "Portugal" },
  { id: 202, name: "Taiwan" },
  { id: 203, name: "Japan" },
  { id: 204, name: "Colombia" },
  { id: 205, name: "Thailand" },
  { id: 206, name: "Bolivia" },
  { id: 207, name: "Australia" },
  { id: 212, name: "Mexico" },
  { id: 213, name: "Belgium" },
  { id: 214, name: "Ireland" },
  { id: 292, name: "New Zealand" },
  { id: 302, name: "Andorra" },
  { id: 305, name: "China" },
  { id: 313, name: "Slovakia" },
  { id: 314, name: "Romania" },
  { id: 373, name: "Saudi Arabia" },
  { id: 375, name: "Peru" },
  { id: 404, name: "Brazil" },
];

type Position = [number, number];
type Ring = Position[];

interface Geometry {
  type: string;
  coordinates: unknown;
}

interface Feature {
  properties: { ADMIN?: string };
  geometry: Geometry;
}

function outerRings(geometry: Geometry): Ring[] {
  if (geometry.type === "Polygon") {
    return [(geometry.coordinates as Ring[])[0]];
  }
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as Ring[][]).map((polygon) => polygon[0]);
  }
  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

/**
 * Bounding box(es) for one polygon ring. A ring whose longitudes span more
 * than 180° crosses the antimeridian (the Aleutians), so its points are split
 * into east and west hemispheres and boxed separately.
 */
function ringBoxes(ring: Ring): BoundingBox[] {
  const lons = ring.map(([lon]) => lon);
  const spansAntimeridian = Math.max(...lons) - Math.min(...lons) > 180;
  const groups = spansAntimeridian
    ? [ring.filter(([lon]) => lon >= 0), ring.filter(([lon]) => lon < 0)]
    : [ring];
  return groups
    .filter((points) => points.length > 0)
    .map((points) => ({
      south: Math.min(...points.map(([, lat]) => lat)),
      west: Math.min(...points.map(([lon]) => lon)),
      north: Math.max(...points.map(([, lat]) => lat)),
      east: Math.max(...points.map(([lon]) => lon)),
    }));
}

function pad(box: BoundingBox): BoundingBox {
  return {
    south: Math.max(-90, box.south - PAD_DEGREES),
    west: Math.max(-180, box.west - PAD_DEGREES),
    north: Math.min(90, box.north + PAD_DEGREES),
    east: Math.min(180, box.east + PAD_DEGREES),
  };
}

function overlaps(a: BoundingBox, b: BoundingBox): boolean {
  return a.south <= b.north && b.south <= a.north && a.west <= b.east && b.west <= a.east;
}

function union(a: BoundingBox, b: BoundingBox): BoundingBox {
  return {
    south: Math.min(a.south, b.south),
    west: Math.min(a.west, b.west),
    north: Math.max(a.north, b.north),
    east: Math.max(a.east, b.east),
  };
}

function area(box: BoundingBox): number {
  return (box.north - box.south) * (box.east - box.west);
}

function mergeOverlapping(boxes: BoundingBox[]): BoundingBox[] {
  const merged = [...boxes];
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < merged.length; i++) {
      for (let j = i + 1; j < merged.length; j++) {
        if (overlaps(merged[i], merged[j])) {
          merged[i] = union(merged[i], merged[j]);
          merged.splice(j, 1);
          changed = true;
          break outer;
        }
      }
    }
  }
  return merged;
}

/**
 * Reduces to at most MAX_BOXES_PER_ZONE by repeatedly unioning the pair whose
 * combined box wastes the least extra area, then re-merging any overlaps the
 * unions introduced.
 */
function capCount(boxes: BoundingBox[]): BoundingBox[] {
  let capped = [...boxes];
  while (capped.length > MAX_BOXES_PER_ZONE) {
    let best: [number, number] = [0, 1];
    let bestWaste = Number.POSITIVE_INFINITY;
    for (let i = 0; i < capped.length; i++) {
      for (let j = i + 1; j < capped.length; j++) {
        const waste = area(union(capped[i], capped[j])) - area(capped[i]) - area(capped[j]);
        if (waste < bestWaste) {
          bestWaste = waste;
          best = [i, j];
        }
      }
    }
    const [i, j] = best;
    capped[i] = union(capped[i], capped[j]);
    capped.splice(j, 1);
    capped = mergeOverlapping(capped);
  }
  return capped;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function countryBoxes(feature: Feature): BoundingBox[] {
  const raw = outerRings(feature.geometry).flatMap(ringBoxes).map(pad);
  return capCount(mergeOverlapping(raw)).map((box) => ({
    south: round(box.south),
    west: round(box.west),
    north: round(box.north),
    east: round(box.east),
  }));
}

const response = await fetch(DATASET_URL);
if (!response.ok) {
  throw new Error(`Failed to fetch Natural Earth dataset: ${response.status}`);
}
const dataset = (await response.json()) as { features: Feature[] };

const byAdmin = new Map<string, Feature>();
for (const feature of dataset.features) {
  if (feature.properties.ADMIN) {
    byAdmin.set(feature.properties.ADMIN, feature);
  }
}

const entries = ZONES.map((zone) => {
  const feature = byAdmin.get(zone.admin ?? zone.name);
  if (!feature) {
    throw new Error(`No Natural Earth feature for ${zone.admin ?? zone.name}`);
  }
  return { id: zone.id, name: zone.name, boxes: countryBoxes(feature) };
});

const lines = [
  "/**",
  " * Generated by src/pjamm/generate-zones.ts from Natural Earth 1:50m admin-0",
  " * countries (public domain), pinned to tag v5.1.2. Do not edit by hand.",
  " * Regenerate with: bun src/pjamm/generate-zones.ts",
  " */",
  "",
  'import type { BoundingBox } from "./types";',
  "",
  "export const GENERATED_COUNTRY_ZONES: {",
  "  id: number;",
  "  name: string;",
  "  boxes: BoundingBox[];",
  "}[] = [",
];
function formatBox(box: BoundingBox): string {
  return `{ south: ${box.south}, west: ${box.west}, north: ${box.north}, east: ${box.east} }`;
}

for (const entry of entries) {
  lines.push(`  {`, `    id: ${entry.id},`, `    name: ${JSON.stringify(entry.name)},`);
  if (entry.boxes.length === 1) {
    lines.push(`    boxes: [${formatBox(entry.boxes[0])}],`);
  } else {
    lines.push(`    boxes: [`);
    for (const box of entry.boxes) {
      lines.push(`      ${formatBox(box)},`);
    }
    lines.push(`    ],`);
  }
  lines.push(`  },`);
}
lines.push("];", "");

await Bun.write(OUTPUT_PATH, lines.join("\n"));
console.log(`Wrote ${entries.length} zones to ${OUTPUT_PATH}`);
