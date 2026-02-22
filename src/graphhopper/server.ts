import {
  createSdkMcpServer,
  type McpSdkServerConfigWithInstance,
  tool,
} from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

function text(content: string) {
  return { content: [{ type: "text" as const, text: content }] };
}

const profileMap: Record<string, string> = {
  road: "bike",
  mountain: "bike",
  racing: "bike",
};

export interface RoutePath {
  distance: number;
  time: number;
  points: { coordinates: number[][] };
  instructions: { text: string; distance: number; time: number }[];
}

interface RouteResponse {
  paths: RoutePath[];
}

export interface GeocodeHit {
  name: string;
  point: { lat: number; lng: number };
  country: string;
}

interface GeocodeResponse {
  hits: GeocodeHit[];
}

function resolveVehicle(profile?: string): string {
  if (!profile) return "bike";
  return profileMap[profile] ?? "bike";
}

const BASE_URL = "https://graphhopper.com/api/1";

export async function fetchRoute(
  apiKey: string,
  waypoints: [number, number][],
  profile?: string,
): Promise<RoutePath> {
  const vehicle = resolveVehicle(profile);
  const params = new URLSearchParams({
    key: apiKey,
    vehicle,
    elevation: "true",
    instructions: "true",
    points_encoded: "false",
  });
  for (const [lat, lng] of waypoints) {
    params.append("point", `${lat},${lng}`);
  }

  const response = await fetch(`${BASE_URL}/route?${params.toString()}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GraphHopper route error: ${response.status} ${error}`);
  }

  const data = (await response.json()) as RouteResponse;
  return data.paths[0];
}

export async function fetchGeocode(apiKey: string, query: string): Promise<GeocodeHit[]> {
  const params = new URLSearchParams({
    q: query,
    key: apiKey,
  });

  const response = await fetch(`${BASE_URL}/geocode?${params.toString()}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GraphHopper geocode error: ${response.status} ${error}`);
  }

  const data = (await response.json()) as GeocodeResponse;
  return data.hits ?? [];
}

function formatRoute(path: RoutePath): string {
  const coords = path.points.coordinates;
  const elevations = coords.map((c) => c[2] ?? 0);
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);

  const instructions = path.instructions.map(
    (inst) => `- ${inst.text} (${inst.distance}m, ${Math.round(inst.time / 1000)}s)`,
  );

  return [
    "## Route Summary",
    `- Distance: ${path.distance}m`,
    `- Duration: ${path.time}ms`,
    `- Elevation range: ${minElevation}m - ${maxElevation}m`,
    `- Waypoints: ${coords.length}`,
    "",
    "## Instructions",
    ...instructions,
    "",
    "## Coordinates",
    `${coords.length} points (first: [${coords[0].join(", ")}], last: [${coords[coords.length - 1].join(", ")}])`,
  ].join("\n");
}

function formatGeocode(hits: GeocodeHit[]): string {
  if (hits.length === 0) return "No results found";
  const results = hits.map(
    (hit) => `- ${hit.name} (${hit.point.lat}, ${hit.point.lng}) — ${hit.country}`,
  );
  return ["## Geocode Results", ...results].join("\n");
}

export function createGraphHopperServer(apiKey: string): McpSdkServerConfigWithInstance {
  const route = tool(
    "route",
    "Generate a cycling route between waypoints with elevation data",
    {
      waypoints: z
        .array(z.tuple([z.number(), z.number()]))
        .min(2)
        .describe("Array of [lat, lng] waypoints"),
      profile: z
        .enum(["road", "mountain", "racing"])
        .optional()
        .describe("Cycling profile: road, mountain, or racing"),
    },
    async ({ waypoints, profile }) => {
      try {
        const path = await fetchRoute(apiKey, waypoints, profile);
        return text(formatRoute(path));
      } catch (e) {
        return text(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  );

  const geocode = tool(
    "geocode",
    "Convert place names to coordinates",
    {
      query: z.string().describe("Place name or address to geocode"),
    },
    async ({ query }) => {
      try {
        const hits = await fetchGeocode(apiKey, query);
        return text(formatGeocode(hits));
      } catch (e) {
        return text(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  );

  return createSdkMcpServer({
    name: "graphhopper",
    tools: [route, geocode],
  });
}
