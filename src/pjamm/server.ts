import {
  createSdkMcpServer,
  type McpSdkServerConfigWithInstance,
  tool,
} from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { fetchClimb, searchClimbs } from "./pjamm";

function text(content: string) {
  return { content: [{ type: "text" as const, text: content }] };
}

const boundingBoxSchema = {
  south: z.number().describe("Southern latitude boundary"),
  west: z.number().describe("Western longitude boundary"),
  north: z.number().describe("Northern latitude boundary"),
  east: z.number().describe("Eastern longitude boundary"),
};

export function createPjammServer(): McpSdkServerConfigWithInstance {
  const searchClimbsTool = tool(
    "search-climbs",
    "Find documented road bike climbs within a bounding box, with stats (distance, elevation gain, grade, FIETS, PJAMM difficulty index)",
    boundingBoxSchema,
    async ({ south, west, north, east }) => {
      try {
        const climbs = await searchClimbs({ south, west, north, east });
        return text(JSON.stringify(climbs));
      } catch (e) {
        return text(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  );

  const getClimbTool = tool(
    "get-climb",
    "Get full detail for a climb by PJAMM id: narratives (summary, gradient, roadway, gear, travel), ratings, start/end coordinates, and photos",
    {
      id: z.number().describe("PJAMM climb id, as returned by search-climbs"),
    },
    async ({ id }) => {
      try {
        const climb = await fetchClimb(id);
        return text(JSON.stringify(climb));
      } catch (e) {
        return text(`Error: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  );

  return createSdkMcpServer({
    name: "pjamm",
    tools: [searchClimbsTool, getClimbTool],
  });
}
