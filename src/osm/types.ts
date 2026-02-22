export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface OsmNode {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

export interface OsmWay {
  id: number;
  tags: Record<string, string>;
  nodes: number[];
  geometry?: Array<{ lat: number; lon: number }>;
}

export interface OverpassResponse {
  elements: Array<OsmNode | OsmWay>;
}

export interface WaterSource {
  id: number;
  lat: number;
  lon: number;
  type: "drinking_water" | "water_point";
  name?: string;
}

export interface CyclingInfrastructure {
  id: number;
  lat: number;
  lon: number;
  type: "bicycle_repair_station" | "bicycle_parking" | "bicycle_shop";
  name?: string;
}

export interface RoadSurface {
  id: number;
  highway: string;
  surface: string;
  name?: string;
}
