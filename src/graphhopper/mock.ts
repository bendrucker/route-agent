import {
  createSdkMcpServer,
  type McpSdkServerConfigWithInstance,
  tool,
} from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

function text(content: string) {
  return { content: [{ type: "text" as const, text: content }] };
}

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
  async () => {
    const coords = [
      [-122.143, 37.4419, 10],
      [-122.2, 37.41, 45],
      [-122.35, 37.32, 180],
      [-122.406, 37.263, 320],
      [-122.44, 37.495, 25],
    ];

    return text(
      [
        "## Route Summary",
        "- Distance: 52300m",
        "- Duration: 7920000ms",
        "- Elevation range: 10m - 320m",
        "- Waypoints: 5",
        "",
        "## Instructions",
        "- Head southwest on University Avenue (200m, 30s)",
        "- Turn right onto Junipero Serra Boulevard (1500m, 180s)",
        "- Continue onto CA-35 / Skyline Boulevard (8500m, 1200s)",
        "- Turn left onto Tunitas Creek Road (12000m, 2400s)",
        "- Continue onto CA-1 / Cabrillo Highway (15000m, 1800s)",
        "- Turn right onto Kelly Avenue (200m, 30s)",
        "- Arrive at destination (0m, 0s)",
        "",
        "## Coordinates",
        `5 points (first: [${coords[0].join(", ")}], last: [${coords[coords.length - 1].join(", ")}])`,
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
  async () => {
    return text(
      [
        "## Geocode Results",
        "- Palo Alto (37.4419, -122.143) — US",
        "- Palo Alto Baylands Nature Preserve (37.4585, -122.1057) — US",
        "- Palo Alto Hills (37.3807, -122.1658) — US",
      ].join("\n"),
    );
  },
);

export function createMockGraphHopperServer(): McpSdkServerConfigWithInstance {
  return createSdkMcpServer({
    name: "graphhopper-mock",
    tools: [route, geocode],
  });
}
