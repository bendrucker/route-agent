import type { RoutePath } from "../../graphhopper/server";
import type { ActivitySummary, HistoryAnalysisOutput, SegmentSummary } from "../history-analysis";

export type CyclingProfile = "road" | "mountain" | "racing";

export interface DistanceTarget {
  target: number;
  tolerance?: number;
}

export interface ElevationTarget {
  target?: number;
  max?: number;
}

export interface RoutePreferences {
  profile?: CyclingProfile;
  loop?: boolean;
  preferFamiliarRoads?: boolean;
}

export interface RouteRequest {
  startLocation: string;
  distance: DistanceTarget;
  elevation?: ElevationTarget;
  preferences?: RoutePreferences;
}

/**
 * Waypoints in the shape the GraphHopper `route` tool expects, ready to be
 * passed straight through as its `waypoints` argument.
 */
export interface WaypointGuidance {
  waypoints: [number, number][];
  profile: CyclingProfile;
}

export interface RouteSynthesisOutput {
  guidance: WaypointGuidance;
  reusedActivities: ActivitySummary[];
  reusedSegments: SegmentSummary[];
  rationale: string[];
}

export interface RouteSynthesisInput {
  history: HistoryAnalysisOutput;
  request: RouteRequest;
  start: [number, number];
}

/**
 * A route after the agent has called the GraphHopper `route` tool with a
 * synthesis output's waypoints, ready to hand to `generateGpx`.
 */
export interface FinalizedRoute {
  path: RoutePath;
  name: string;
  description: string;
}
