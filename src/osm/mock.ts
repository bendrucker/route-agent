import {
  createSdkMcpServer,
  type McpSdkServerConfigWithInstance,
  tool,
} from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type { CyclingInfrastructure, RoadSurface, WaterSource } from "./types";

function text(content: string) {
  return { content: [{ type: "text" as const, text: content }] };
}

const boundingBoxSchema = {
  south: z.number().describe("Southern latitude boundary"),
  west: z.number().describe("Western longitude boundary"),
  north: z.number().describe("Northern latitude boundary"),
  east: z.number().describe("Eastern longitude boundary"),
};

const waterSources: WaterSource[] = [
  {
    id: 1001,
    lat: 37.4275,
    lon: -122.1697,
    type: "drinking_water",
    name: "Mitchell Park Fountain",
  },
  {
    id: 1002,
    lat: 37.4346,
    lon: -122.1609,
    type: "drinking_water",
    name: "Peers Park Water Fountain",
  },
  {
    id: 1003,
    lat: 37.4191,
    lon: -122.1488,
    type: "drinking_water",
  },
  {
    id: 1004,
    lat: 37.4385,
    lon: -122.1278,
    type: "water_point",
    name: "Arastradero Preserve Water Station",
  },
];

const cyclingInfrastructure: CyclingInfrastructure[] = [
  {
    id: 2001,
    lat: 37.4419,
    lon: -122.143,
    type: "bicycle_repair_station",
    name: "Palo Alto Caltrain Bike Fix-It Station",
  },
  {
    id: 2002,
    lat: 37.4293,
    lon: -122.1381,
    type: "bicycle_repair_station",
    name: "Stanford Shopping Center Bike Repair",
  },
  {
    id: 2003,
    lat: 37.4449,
    lon: -122.1617,
    type: "bicycle_parking",
  },
  {
    id: 2004,
    lat: 37.4396,
    lon: -122.1604,
    type: "bicycle_shop",
    name: "Mike's Bikes Palo Alto",
  },
  {
    id: 2005,
    lat: 37.4455,
    lon: -122.1621,
    type: "bicycle_shop",
    name: "Palo Alto Bicycles",
  },
];

const roadSurfaces: RoadSurface[] = [
  {
    id: 3001,
    highway: "residential",
    surface: "asphalt",
    name: "Bryant Street",
  },
  {
    id: 3002,
    highway: "cycleway",
    surface: "asphalt",
    name: "Stevens Creek Trail",
  },
  {
    id: 3003,
    highway: "path",
    surface: "gravel",
    name: "Arastradero Creek Trail",
  },
  {
    id: 3004,
    highway: "tertiary",
    surface: "asphalt",
    name: "Page Mill Road",
  },
  {
    id: 3005,
    highway: "track",
    surface: "dirt",
  },
];

const findWaterSourcesTool = tool(
  "find-water-sources",
  "Find drinking water fountains and water points in an area",
  boundingBoxSchema,
  async () => text(JSON.stringify(waterSources)),
);

const findCyclingInfrastructureTool = tool(
  "find-cycling-infrastructure",
  "Find bike repair stations, bike parking, and bike shops in an area",
  boundingBoxSchema,
  async () => text(JSON.stringify(cyclingInfrastructure)),
);

const querySurfaceTypesTool = tool(
  "query-surface-types",
  "Query road surface types in an area",
  boundingBoxSchema,
  async () => text(JSON.stringify(roadSurfaces)),
);

export function createMockOsmServer(): McpSdkServerConfigWithInstance {
  return createSdkMcpServer({
    name: "osm-mock",
    tools: [findWaterSourcesTool, findCyclingInfrastructureTool, querySurfaceTypesTool],
  });
}
