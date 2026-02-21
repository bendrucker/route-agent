import type {
  BoundingBox,
  CyclingInfrastructure,
  OsmNode,
  OsmWay,
  OverpassResponse,
  RoadSurface,
  WaterSource,
} from "./types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

function bbox(b: BoundingBox): string {
  return `${b.south},${b.west},${b.north},${b.east}`;
}

async function query(ql: string): Promise<OverpassResponse> {
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(ql)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as OverpassResponse;
}

export async function findWaterSources(bounds: BoundingBox): Promise<WaterSource[]> {
  const ql = `[out:json][timeout:25];
(
  node["amenity"="drinking_water"](${bbox(bounds)});
  node["amenity"="water_point"](${bbox(bounds)});
);
out body;`;

  const data = await query(ql);

  return (data.elements as OsmNode[]).map((el) => ({
    id: el.id,
    lat: el.lat,
    lon: el.lon,
    type: el.tags.amenity as WaterSource["type"],
    ...(el.tags.name ? { name: el.tags.name } : {}),
  }));
}

export async function findCyclingInfrastructure(
  bounds: BoundingBox,
): Promise<CyclingInfrastructure[]> {
  const ql = `[out:json][timeout:25];
(
  node["amenity"="bicycle_repair_station"](${bbox(bounds)});
  node["amenity"="bicycle_parking"](${bbox(bounds)});
  node["shop"="bicycle"](${bbox(bounds)});
);
out body;`;

  const data = await query(ql);

  return (data.elements as OsmNode[]).map((el) => {
    let type: CyclingInfrastructure["type"];
    if (el.tags.shop === "bicycle") {
      type = "bicycle_shop";
    } else {
      type = el.tags.amenity as "bicycle_repair_station" | "bicycle_parking";
    }

    return {
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      type,
      ...(el.tags.name ? { name: el.tags.name } : {}),
    };
  });
}

export async function querySurfaceTypes(bounds: BoundingBox): Promise<RoadSurface[]> {
  const ql = `[out:json][timeout:25];
way["highway"]["surface"](${bbox(bounds)});
out body;`;

  const data = await query(ql);

  return (data.elements as OsmWay[]).map((el) => ({
    id: el.id,
    highway: el.tags.highway,
    surface: el.tags.surface,
    ...(el.tags.name ? { name: el.tags.name } : {}),
  }));
}
