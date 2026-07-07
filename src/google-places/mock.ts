import {
  createSdkMcpServer,
  type McpSdkServerConfigWithInstance,
  tool,
} from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type { Place } from "./types";

function text(content: string) {
  return { content: [{ type: "text" as const, text: content }] };
}

const boundingBoxSchema = {
  south: z.number().describe("Southern latitude boundary"),
  west: z.number().describe("Western longitude boundary"),
  north: z.number().describe("Northern latitude boundary"),
  east: z.number().describe("Eastern longitude boundary"),
};

const places: Place[] = [
  {
    id: "mock-place-1",
    name: "Downtown Local",
    address: "622 Stage Rd, Pescadero, CA 94060",
    lat: 37.2544,
    lng: -122.3808,
    rating: 4.6,
    userRatingCount: 812,
    openNow: true,
    types: ["cafe", "bakery", "food"],
  },
  {
    id: "mock-place-2",
    name: "Duarte's Tavern",
    address: "202 Stage Rd, Pescadero, CA 94060",
    lat: 37.2551,
    lng: -122.3814,
    rating: 4.4,
    userRatingCount: 1523,
    openNow: true,
    types: ["restaurant", "bar", "food"],
  },
  {
    id: "mock-place-3",
    name: "Tunitas Creek Store",
    address: "700 Tunitas Creek Rd, Half Moon Bay, CA 94019",
    lat: 37.3312,
    lng: -122.3959,
    rating: 4.1,
    userRatingCount: 96,
    openNow: false,
    types: ["convenience_store", "food"],
  },
];

export function createMockGooglePlacesServer(): McpSdkServerConfigWithInstance {
  const findPlacesTool = tool(
    "find-places",
    "Find places (cafes, shops, points of interest) within a bounding box by text query",
    {
      ...boundingBoxSchema,
      query: z.string().describe("Text query, e.g. 'coffee shop' or 'bike shop'"),
      openNow: z.boolean().optional().describe("Only return places currently open"),
    },
    async () => text(JSON.stringify(places)),
  );

  return createSdkMcpServer({
    name: "google-places-mock",
    tools: [findPlacesTool],
  });
}
