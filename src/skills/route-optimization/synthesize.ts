import type { ActivitySummary } from "../history-analysis";
import type { RouteRequest, RouteSynthesisInput, RouteSynthesisOutput } from "./types";

const MAX_REUSED_ANCHORS = 2;
const POINT_EPSILON = 1e-4;

function pointsEqual(a: [number, number], b: [number, number]): boolean {
  return Math.abs(a[0] - b[0]) < POINT_EPSILON && Math.abs(a[1] - b[1]) < POINT_EPSILON;
}

function isWithinTolerance(activity: ActivitySummary, request: RouteRequest): boolean {
  const { target, tolerance = 0.15 } = request.distance;
  const distanceOk = Math.abs(activity.distance - target) <= target * tolerance;
  if (!distanceOk) return false;

  const elevationTarget = request.elevation?.target;
  if (elevationTarget === undefined) return true;
  return Math.abs(activity.elevationGain - elevationTarget) <= elevationTarget * tolerance;
}

function fitScore(activity: ActivitySummary, request: RouteRequest): number {
  const distanceScore =
    Math.abs(activity.distance - request.distance.target) / request.distance.target;
  const elevationTarget = request.elevation?.target;
  const elevationScore =
    elevationTarget === undefined
      ? 0
      : Math.abs(activity.elevationGain - elevationTarget) / Math.max(elevationTarget, 1);
  return distanceScore + elevationScore;
}

function selectAnchors(activities: ActivitySummary[], request: RouteRequest): ActivitySummary[] {
  if (request.preferences?.preferFamiliarRoads === false) return [];

  return activities
    .filter((activity) => isWithinTolerance(activity, request))
    .sort((a, b) => fitScore(a, request) - fitScore(b, request))
    .slice(0, MAX_REUSED_ANCHORS);
}

function buildWaypoints(
  start: [number, number],
  anchors: ActivitySummary[],
  loop: boolean,
): [number, number][] {
  if (anchors.length === 0) return [start];

  const points: [number, number][] = [start, ...anchors.map((a) => a.startLatLng)];
  const last = points[points.length - 1];
  if (loop && !pointsEqual(last, start)) points.push(start);
  return points;
}

function buildRationale(anchors: ActivitySummary[], reusedSegmentCount: number): string[] {
  const rationale: string[] = [];

  if (anchors.length === 0) {
    rationale.push(
      "No prior rides matched the requested distance/elevation. The plan only anchors on the start point and needs additional waypoints (e.g. via geocoding) before routing.",
    );
  } else {
    for (const anchor of anchors) {
      rationale.push(`Reusing "${anchor.name}" as a waypoint. It's a similar ride done before.`);
    }
  }

  if (reusedSegmentCount > 0) {
    rationale.push(
      `${reusedSegmentCount} known segment(s) available nearby as route building blocks.`,
    );
  }

  return rationale;
}

/**
 * Turns ride history plus a route request into waypoint guidance an agent can
 * pass to the GraphHopper `route` tool. Anchors on prior activities whose
 * distance and elevation are close to the request; falls back to the start
 * point alone when nothing in history is a close match.
 */
export function synthesizeRoute(input: RouteSynthesisInput): RouteSynthesisOutput {
  const { history, request, start } = input;
  const profile = request.preferences?.profile ?? "road";
  const loop = request.preferences?.loop ?? true;

  const anchors = selectAnchors(history.relevantActivities, request);
  const waypoints = buildWaypoints(start, anchors, loop);

  return {
    guidance: { waypoints, profile },
    reusedActivities: anchors,
    reusedSegments: history.reusableSegments,
    rationale: buildRationale(anchors, history.reusableSegments.length),
  };
}
