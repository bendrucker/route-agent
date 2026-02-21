import {
  createSdkMcpServer,
  type McpSdkServerConfigWithInstance,
  tool,
} from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { findCyclingInfrastructure, findWaterSources, querySurfaceTypes } from "./overpass";

function text(content: string) {
  return { content: [{ type: "text" as const, text: content }] };
}

const boundingBoxSchema = {
  south: z.number().describe("Southern latitude boundary"),
  west: z.number().describe("Western longitude boundary"),
  north: z.number().describe("Northern latitude boundary"),
  east: z.number().describe("Eastern longitude boundary"),
};

const findWaterSourcesTool = tool(
  "find-water-sources",
  "Find drinking water fountains and water points in an area",
  boundingBoxSchema,
  async (bounds) => text(JSON.stringify(await findWaterSources(bounds))),
);

const findCyclingInfrastructureTool = tool(
  "find-cycling-infrastructure",
  "Find bike repair stations, bike parking, and bike shops in an area",
  boundingBoxSchema,
  async (bounds) => text(JSON.stringify(await findCyclingInfrastructure(bounds))),
);

const querySurfaceTypesTool = tool(
  "query-surface-types",
  "Query road surface types in an area",
  boundingBoxSchema,
  async (bounds) => text(JSON.stringify(await querySurfaceTypes(bounds))),
);

export function createOsmServer(): McpSdkServerConfigWithInstance {
  return createSdkMcpServer({
    name: "osm",
    tools: [findWaterSourcesTool, findCyclingInfrastructureTool, querySurfaceTypesTool],
  });
}
