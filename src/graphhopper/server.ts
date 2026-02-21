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
  road: "racingbike",
  mountain: "mtb",
  racing: "racingbike",
  default: "bike",
};

interface RouteResponse {
  paths: {
    distance: number;
    time: number;
    points: { coordinates: number[][] };
    instructions: { text: string; distance: number; time: number }[];
  }[];
}

interface GeocodeResponse {
  hits: { name: string; point: { lat: number; lng: number }; country: string }[];
}

function resolveVehicle(profile?: string): string {
  if (!profile) return "bike";
  return profileMap[profile] ?? "bike";
}

export function createGraphHopperServer(apiKey: string): McpSdkServerConfigWithInstance {
  const baseUrl = "https://graphhopper.com/api/1";

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

      const response = await fetch(`${baseUrl}/route?${params.toString()}`);
      if (!response.ok) {
        const error = await response.text();
        return text(`Error: ${response.status} ${error}`);
      }

      const data = (await response.json()) as RouteResponse;
      const path = data.paths[0];
      const coords = path.points.coordinates;

      const elevations = coords.map((c) => c[2] ?? 0);
      const minElevation = Math.min(...elevations);
      const maxElevation = Math.max(...elevations);

      const instructions = path.instructions.map(
        (inst) => `- ${inst.text} (${inst.distance}m, ${Math.round(inst.time / 1000)}s)`,
      );

      return text(
        [
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
        ].join("\n"),
      );
    },
  );

  const geocode = tool(
    "geocode",
    "Convert place names to coordinates",
    {
      query: z.string().describe("Place name or address to geocode"),
    },
    async ({ query }) => {
      const params = new URLSearchParams({
        q: query,
        key: apiKey,
      });

      const response = await fetch(`${baseUrl}/geocode?${params.toString()}`);
      if (!response.ok) {
        const error = await response.text();
        return text(`Error: ${response.status} ${error}`);
      }

      const data = (await response.json()) as GeocodeResponse;
      const hits = data.hits ?? [];

      if (hits.length === 0) {
        return text("No results found");
      }

      const results = hits.map(
        (hit) => `- ${hit.name} (${hit.point.lat}, ${hit.point.lng}) — ${hit.country}`,
      );

      return text(["## Geocode Results", ...results].join("\n"));
    },
  );

  return createSdkMcpServer({
    name: "graphhopper",
    tools: [route, geocode],
  });
}
