import type { RoutePath } from "../../graphhopper/server";
import type { HistoryAnalysisOutput } from "../history-analysis";
import type { RouteRequest, RouteSynthesisOutput } from "./types";

function formatKm(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDistanceLine(request: RouteRequest): string {
  const { target, tolerance } = request.distance;
  const range = tolerance ? ` (+/-${Math.round(tolerance * 100)}%)` : "";
  return `- Distance: ${formatKm(target)}${range}`;
}

function formatElevationLine(request: RouteRequest): string | undefined {
  if (!request.elevation?.target) return undefined;
  return `- Elevation: ${Math.round(request.elevation.target)}m of climbing`;
}

function formatPreferencesLine(request: RouteRequest): string | undefined {
  const prefs = request.preferences;
  if (!prefs) return undefined;

  const parts: string[] = [];
  if (prefs.profile) parts.push(`profile: ${prefs.profile}`);
  if (prefs.loop !== undefined) parts.push(prefs.loop ? "loop" : "point-to-point");
  if (prefs.preferFamiliarRoads) parts.push("prefer familiar roads");

  return parts.length > 0 ? `- Preferences: ${parts.join(", ")}` : undefined;
}

/**
 * Prompt guidance for the confirm_intent checkpoint stage.
 */
export function buildConfirmIntentPrompt(request: RouteRequest): string {
  const lines = [
    "Present the following route request to the user for confirmation:",
    "",
    `- Start: ${request.startLocation || "not specified, ask the user"}`,
    formatDistanceLine(request),
    formatElevationLine(request),
    formatPreferencesLine(request),
    "",
    'Use the present_route_plan tool with stage "confirm_intent".',
    'Ask: "Does this match what you\'re looking for?"',
  ].filter((line): line is string => line !== undefined);

  return lines.join("\n");
}

/**
 * Prompt guidance for the present_findings checkpoint stage. Summarizes the
 * History Analysis skill's output before synthesis produces route candidates.
 */
export function buildPresentFindingsPrompt(history: HistoryAnalysisOutput): string {
  const lines = [
    "Present the History Analysis research findings to the user:",
    "",
    `- Relevant past rides in this area: ${history.relevantActivities.length}`,
    `- Reusable segments: ${history.reusableSegments.length}`,
    `- Typical distance from history: ${formatKm(history.preferences.distance.avg)} (max ${formatKm(history.preferences.distance.max)})`,
    "",
    'Use the present_route_plan tool with stage "present_findings".',
    'Ask: "Would you like me to generate route options based on these findings?"',
  ];

  return lines.join("\n");
}

function formatCandidate(candidate: RouteSynthesisOutput, index: number): string {
  return [
    `**Option ${index + 1}** (${candidate.guidance.profile}, ${candidate.guidance.waypoints.length} waypoints)`,
    ...candidate.rationale.map((r) => `- ${r}`),
  ].join("\n");
}

/**
 * Prompt guidance for the select_route checkpoint stage. Takes multiple
 * synthesis outputs, e.g. from varying preferences across calls to synthesizeRoute.
 */
export function buildSelectRoutePrompt(candidates: RouteSynthesisOutput[]): string {
  const lines = [
    "Present the following synthesized route options to the user:",
    "",
    ...candidates.map((c, i) => formatCandidate(c, i)),
    "",
    'Use the present_route_plan tool with stage "select_route".',
    'Ask: "Which route would you like to select?"',
  ];

  return lines.join("\n");
}

/**
 * Prompt guidance for the present_final checkpoint stage, after the agent has
 * called the GraphHopper route tool with the chosen candidate's waypoints.
 */
export function buildPresentFinalPrompt(chosen: RouteSynthesisOutput, path: RoutePath): string {
  const lines = [
    "Present the final route to the user:",
    "",
    `- Distance: ${formatKm(path.distance)}`,
    `- Duration: ${Math.round(path.time / 60000)} min`,
    `- Profile: ${chosen.guidance.profile}`,
    ...chosen.rationale.map((r) => `- ${r}`),
    "",
    "The route is ready to hand to generateGpx for a downloadable GPX file.",
    'Use the present_route_plan tool with stage "present_final".',
    'Ask: "Ready to generate the GPX file?"',
  ];

  return lines.join("\n");
}
