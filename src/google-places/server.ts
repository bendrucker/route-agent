import {
  createSdkMcpServer,
  type McpSdkServerConfigWithInstance,
  tool,
} from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { findPlaces } from "./places";

function text(content: string) {
  return { content: [{ type: "text" as const, text: content }] };
}

const boundingBoxSchema = {
  south: z.number().describe("Southern latitude boundary"),
  west: z.number().describe("Western longitude boundary"),
  north: z.number().describe("Northern latitude boundary"),
  east: z.number().describe("Eastern longitude boundary"),
};

export function createGooglePlacesServer(apiKey: string): McpSdkServerConfigWithInstance {
  const findPlacesTool = tool(
    "find-places",
    "Find places (cafes, shops, points of interest) within a bounding box by text query",
    {
      ...boundingBoxSchema,
      query: z.string().describe("Text query, e.g. 'coffee shop' or 'bike shop'"),
      openNow: z.boolean().optional().describe("Only return places currently open"),
    },
    async ({ south, west, north, east, query, openNow }) => {
      try {
        const places = await findPlaces(apiKey, { south, west, north, east }, query, openNow);
        return text(JSON.stringify(places));
      } catch (e) {
        return text(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  );

  return createSdkMcpServer({
    name: "google-places",
    tools: [findPlacesTool],
  });
}
