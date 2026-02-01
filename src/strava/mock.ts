import {
  createSdkMcpServer,
  type McpSdkServerConfigWithInstance,
  tool,
} from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

function text(content: string) {
  return { content: [{ type: "text" as const, text: content }] };
}

interface Activity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_latlng: number[];
}

function formatActivitySummary(a: Activity): string {
  return [
    `### ${a.name}`,
    `- Distance: ${a.distance}m`,
    `- Moving Time: ${a.moving_time}s`,
    `- Elevation: ${a.total_elevation_gain}m`,
    `- ID: ${a.id}`,
  ].join("\n");
}

const activities: Activity[] = [
  {
    id: 12345,
    name: "Pescadero Loop via Tunitas Creek",
    distance: 105000,
    moving_time: 14400,
    total_elevation_gain: 1800,
    start_latlng: [37.4419, -122.143],
  },
  {
    id: 12346,
    name: "Conservatory Drive Climb",
    distance: 45000,
    moving_time: 7200,
    total_elevation_gain: 900,
    start_latlng: [37.4419, -122.143],
  },
];

const paginationSchema = { page: z.number().optional(), per_page: z.number().optional() };

const getAllActivities = tool(
  "get-all-activities",
  "Get all activities for the authenticated athlete",
  paginationSchema,
  async () => text(activities.map(formatActivitySummary).join("\n\n")),
);

const getRecentActivities = tool(
  "get-recent-activities",
  "Get recent activities for the authenticated athlete",
  paginationSchema,
  async () => text(activities.map(formatActivitySummary).join("\n\n")),
);

const getActivityDetails = tool(
  "get-activity-details",
  "Get detailed information about a specific activity",
  { activity_id: z.number() },
  async ({ activity_id }) => {
    const activity = activities.find((a) => a.id === activity_id);
    if (!activity) return text("Activity not found");
    return text(
      [
        `# ${activity.name}`,
        `- Distance: ${activity.distance}m`,
        `- Moving Time: ${activity.moving_time}s`,
        `- Elevation: ${activity.total_elevation_gain}m`,
        `- Start: ${activity.start_latlng.join(", ")}`,
      ].join("\n"),
    );
  },
);

const exploreSegments = tool(
  "explore-segments",
  "Explore segments in a given area",
  {
    bounds: z.string().describe("SW lat, SW lng, NE lat, NE lng"),
    activity_type: z.string().optional(),
  },
  async () =>
    text(
      [
        "### Tunitas Creek Road Climb",
        "- ID: 98765",
        "- Distance: 8500m",
        "- Avg Grade: 5.2%",
        "- Elev Difference: 442m",
        "",
        "### Stage Road South",
        "- ID: 98766",
        "- Distance: 12000m",
        "- Avg Grade: 2.1%",
        "- Elev Difference: 252m",
      ].join("\n"),
    ),
);

const listSegmentEfforts = tool(
  "list-segment-efforts",
  "List efforts for a given segment",
  { segment_id: z.number() },
  async ({ segment_id }) => {
    const efforts: Record<number, string> = {
      98765: "### Effort 1\n- Activity ID: 12345\n- Elapsed Time: 1920s\n- Moving Time: 1900s",
      98766: "### Effort 1\n- Activity ID: 12345\n- Elapsed Time: 2400s\n- Moving Time: 2380s",
    };
    return text(efforts[segment_id] ?? "No efforts found");
  },
);

const getActivityStreams = tool(
  "get-activity-streams",
  "Get activity streams (GPS, heart rate, power, etc.)",
  {
    activity_id: z.number(),
    stream_types: z.string().describe("Comma-separated stream types"),
  },
  async ({ activity_id }) => {
    if (activity_id === 12345) {
      return text(
        JSON.stringify({
          latlng: {
            data: [
              [37.4419, -122.143],
              [37.41, -122.2],
              [37.263, -122.406],
              [37.255, -122.39],
            ],
          },
        }),
      );
    }
    return text("No stream data available");
  },
);

const listAthleteRoutes = tool(
  "list-athlete-routes",
  "List routes created by the authenticated athlete",
  paginationSchema,
  async () =>
    text(
      [
        "### Pescadero Lunch Ride",
        "- ID: 55555",
        "- Distance: 105000m",
        "- Elevation: 1800m",
        "",
        "### Quick Conservatory Loop",
        "- ID: 55556",
        "- Distance: 45000m",
        "- Elevation: 900m",
      ].join("\n"),
    ),
);

export function createMockStravaServer(): McpSdkServerConfigWithInstance {
  return createSdkMcpServer({
    name: "strava-mock",
    tools: [
      getAllActivities,
      getRecentActivities,
      getActivityDetails,
      exploreSegments,
      listSegmentEfforts,
      getActivityStreams,
      listAthleteRoutes,
    ],
  });
}
