import { describe, expect, test } from "bun:test";
import type { RoutePath } from "../../graphhopper/server";
import type { ActivitySummary, HistoryAnalysisOutput, SegmentSummary } from "../history-analysis";
import { parseRouteRequest } from "./parse";
import {
  buildConfirmIntentPrompt,
  buildPresentFinalPrompt,
  buildPresentFindingsPrompt,
  buildSelectRoutePrompt,
} from "./prompt";
import { synthesizeRoute } from "./synthesize";
import type { RouteRequest, RouteSynthesisOutput } from "./types";

const activities: ActivitySummary[] = [
  {
    id: 1,
    name: "Coastal Loop",
    distance: 58000,
    elevationGain: 500,
    movingTime: 8000,
    startLatLng: [37.9, -122.5],
  },
  {
    id: 2,
    name: "Ridge Climb",
    distance: 61000,
    elevationGain: 900,
    movingTime: 9000,
    startLatLng: [37.91, -122.51],
  },
  {
    id: 3,
    name: "Valley Cruise",
    distance: 20000,
    elevationGain: 100,
    movingTime: 3000,
    startLatLng: [37.92, -122.52],
  },
];

const segments: SegmentSummary[] = [
  { id: 1, name: "Ridge Segment", distance: 3000, avgGrade: 6, elevDifference: 180 },
];

const history: HistoryAnalysisOutput = {
  relevantActivities: activities,
  reusableSegments: segments,
  preferences: {
    rideCount: 50,
    distance: { avg: 50000, max: 80000 },
    elevation: { avg: 600, max: 1200 },
    duration: { avg: 7000, max: 12000 },
  },
};

const start: [number, number] = [37.89, -122.49];

function createRequest(overrides: Partial<RouteRequest> = {}): RouteRequest {
  return {
    startLocation: "Mill Valley",
    distance: { target: 60000, tolerance: 0.15 },
    preferences: { loop: true },
    ...overrides,
  };
}

describe("parseRouteRequest", () => {
  test("parses distance in kilometers", () => {
    const request = parseRouteRequest("Plan a 60km ride from Mill Valley");
    expect(request.distance.target).toBe(60000);
  });

  test("parses distance in miles", () => {
    const request = parseRouteRequest("Plan a 40 mile ride from Fairfax");
    expect(request.distance.target).toBe(Math.round(40 * 1609.34));
  });

  test("parses elevation given in feet of climbing", () => {
    const request = parseRouteRequest("60km ride with 3000ft of climbing from Fairfax");
    expect(request.elevation?.target).toBe(Math.round(3000 * 0.3048));
  });

  test("parses elevation given in meters of elevation gain", () => {
    const request = parseRouteRequest("60km ride with 900m of elevation gain from Fairfax");
    expect(request.elevation?.target).toBe(900);
  });

  test("omits elevation when not mentioned", () => {
    const request = parseRouteRequest("Plan a 60km ride from Mill Valley");
    expect(request.elevation).toBeUndefined();
  });

  test("extracts the start location", () => {
    const request = parseRouteRequest("Plan a 60km ride from Mill Valley with some climbing");
    expect(request.startLocation).toBe("Mill Valley");
  });

  test("defaults to a loop when not specified", () => {
    const request = parseRouteRequest("Plan a 60km ride from Mill Valley");
    expect(request.preferences?.loop).toBe(true);
  });

  test("detects a point-to-point request", () => {
    const request = parseRouteRequest("Plan a 60km point-to-point ride from Mill Valley");
    expect(request.preferences?.loop).toBe(false);
  });

  test("detects a mountain profile from gravel", () => {
    const request = parseRouteRequest("Plan a 60km gravel ride from Mill Valley");
    expect(request.preferences?.profile).toBe("mountain");
  });

  test("detects a racing profile", () => {
    const request = parseRouteRequest("Plan a 60km race pace ride from Mill Valley");
    expect(request.preferences?.profile).toBe("racing");
  });

  test("detects a preference for familiar roads", () => {
    const request = parseRouteRequest("Plan a 60km ride on my favorite roads from Mill Valley");
    expect(request.preferences?.preferFamiliarRoads).toBe(true);
  });

  test("throws when no distance is found", () => {
    expect(() => parseRouteRequest("Plan a ride from Mill Valley")).toThrow();
  });
});

describe("synthesizeRoute", () => {
  test("anchors on activities within tolerance, closest first", () => {
    const result = synthesizeRoute({ history, request: createRequest(), start });
    expect(result.reusedActivities.map((a) => a.id)).toEqual([2, 1]);
    expect(result.guidance.waypoints).toEqual([
      start,
      activities[1].startLatLng,
      activities[0].startLatLng,
      start,
    ]);
  });

  test("falls back to the start point alone when nothing matches", () => {
    const request = createRequest({ distance: { target: 5000, tolerance: 0.15 } });
    const result = synthesizeRoute({ history, request, start });
    expect(result.reusedActivities).toHaveLength(0);
    expect(result.guidance.waypoints).toEqual([start]);
    expect(result.rationale.some((r) => r.includes("No prior rides matched"))).toBe(true);
  });

  test("skips reuse when preferFamiliarRoads is false", () => {
    const request = createRequest({ preferences: { loop: true, preferFamiliarRoads: false } });
    const result = synthesizeRoute({ history, request, start });
    expect(result.reusedActivities).toHaveLength(0);
    expect(result.guidance.waypoints).toEqual([start]);
  });

  test("omits the closing waypoint when loop is false", () => {
    const request = createRequest({ preferences: { loop: false } });
    const result = synthesizeRoute({ history, request, start });
    expect(result.guidance.waypoints).toEqual([
      start,
      activities[1].startLatLng,
      activities[0].startLatLng,
    ]);
  });

  test("defaults to the road profile", () => {
    const result = synthesizeRoute({ history, request: createRequest(), start });
    expect(result.guidance.profile).toBe("road");
  });

  test("passes reusable segments through from history", () => {
    const result = synthesizeRoute({ history, request: createRequest(), start });
    expect(result.reusedSegments).toEqual(segments);
  });
});

describe("buildConfirmIntentPrompt", () => {
  test("includes the parsed request details", () => {
    const prompt = buildConfirmIntentPrompt(
      createRequest({
        elevation: { target: 900 },
        preferences: { profile: "mountain", loop: true, preferFamiliarRoads: true },
      }),
    );
    expect(prompt).toContain("Mill Valley");
    expect(prompt).toContain("60.0 km");
    expect(prompt).toContain("900m of climbing");
    expect(prompt).toContain("profile: mountain");
    expect(prompt).toContain("prefer familiar roads");
  });
});

describe("buildPresentFindingsPrompt", () => {
  test("summarizes history analysis output", () => {
    const prompt = buildPresentFindingsPrompt(history);
    expect(prompt).toContain("History Analysis");
    expect(prompt).toContain("Relevant past rides in this area: 3");
    expect(prompt).toContain("Reusable segments: 1");
    expect(prompt).toContain("50.0 km");
    expect(prompt).toContain("80.0 km");
  });
});

describe("buildSelectRoutePrompt", () => {
  test("presents each synthesized candidate", () => {
    const familiar = synthesizeRoute({ history, request: createRequest(), start });
    const exploratory = synthesizeRoute({
      history,
      request: createRequest({ preferences: { loop: true, preferFamiliarRoads: false } }),
      start,
    });
    const candidates: RouteSynthesisOutput[] = [familiar, exploratory];

    const prompt = buildSelectRoutePrompt(candidates);
    expect(prompt).toContain("Option 1");
    expect(prompt).toContain("Option 2");
    expect(prompt).toContain("Ridge Climb");
    expect(prompt).toContain("No prior rides matched");
  });
});

describe("buildPresentFinalPrompt", () => {
  test("includes the routed distance and duration", () => {
    const chosen = synthesizeRoute({ history, request: createRequest(), start });
    const path: RoutePath = {
      distance: 60500,
      time: 9000000,
      points: {
        coordinates: [
          [-122.5, 37.9, 10],
          [-122.51, 37.91, 20],
        ],
      },
      instructions: [],
    };

    const prompt = buildPresentFinalPrompt(chosen, path);
    expect(prompt).toContain("60.5 km");
    expect(prompt).toContain("150 min");
    expect(prompt).toContain("generateGpx");
  });
});
