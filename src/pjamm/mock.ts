import {
  createSdkMcpServer,
  type McpSdkServerConfigWithInstance,
  tool,
} from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type { Climb, ClimbSummary } from "./types";

function text(content: string) {
  return { content: [{ type: "text" as const, text: content }] };
}

const boundingBoxSchema = {
  south: z.number().describe("Southern latitude boundary"),
  west: z.number().describe("Western longitude boundary"),
  north: z.number().describe("Northern latitude boundary"),
  east: z.number().describe("Eastern longitude boundary"),
};

const summaries: ClimbSummary[] = [
  {
    id: 349,
    name: "Mt. Tam via Panoramic Hwy North",
    lat: 37.89633,
    lng: -122.6365,
    country: "USA",
    state: "CA",
    city: "Stinson Beach",
    distanceMi: 6.56,
    elevGainFt: 2397,
    avgGradePercent: 6.9,
    fiets: 5.04,
    pdi: 14.66,
    worldRank: 1627,
  },
  {
    id: 361,
    name: "Marshall Wall",
    lat: 38.16,
    lng: -122.89,
    country: "USA",
    state: "CA",
    city: "Marshall",
    distanceMi: 1.9,
    elevGainFt: 480,
    avgGradePercent: 4.8,
    fiets: 1.1,
    pdi: 4.2,
  },
];

const climb: Climb = {
  ...summaries[0],
  endLat: 37.92288,
  endLng: -122.59658,
  elevStartFt: 119,
  elevEndFt: 2502,
  ratings: { difficulty: 3.9, road: 4.1, traffic: 3.5, scenery: 4.8 },
  narratives: {
    summary:
      "A steady climb from Stinson Beach through redwood groves to the shoulder of Mount Tamalpais, with long views over the Pacific.",
    gradient: "Mostly even grades near 7%, with a few short steeper pitches.",
    roadway: "Paved two-lane road with narrow shoulders and moderate weekend traffic.",
    gear: "Compact gearing is plenty for the sustained grade.",
    travel: "Start from Stinson Beach, north of San Francisco on Highway 1.",
    location: "Marin County, California, above Stinson Beach.",
  },
  photos: [
    {
      url: "https://pjammcycling.com/images/rides/ride349/small_climb349pic847f.jpeg",
      comment: "Looking back at Stinson Beach from Panoramic Hwy",
      lat: 37.9,
      lng: -122.63,
    },
  ],
};

export function createMockPjammServer(): McpSdkServerConfigWithInstance {
  const searchClimbsTool = tool(
    "search-climbs",
    "Find documented road bike climbs within a bounding box, with stats (distance, elevation gain, grade, FIETS, PJAMM difficulty index)",
    boundingBoxSchema,
    async () => text(JSON.stringify(summaries)),
  );

  const getClimbTool = tool(
    "get-climb",
    "Get full detail for a climb by PJAMM id: narratives (summary, gradient, roadway, gear, travel), ratings, start/end coordinates, and photos",
    {
      id: z.number().describe("PJAMM climb id, as returned by search-climbs"),
    },
    async () => text(JSON.stringify(climb)),
  );

  return createSdkMcpServer({
    name: "pjamm-mock",
    tools: [searchClimbsTool, getClimbTool],
  });
}
