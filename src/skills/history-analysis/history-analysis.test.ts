import { describe, expect, test } from "bun:test";
import { analyzeHistory } from "./analyze";
import { buildHistoryPrompt } from "./prompt";
import type {
  ActivitySummary,
  GeographicBounds,
  HistoryAnalysisInput,
  RidingPreferences,
  SegmentSummary,
} from "./types";

const marinArea: GeographicBounds = {
  sw: { lat: 37.82, lng: -122.6 },
  ne: { lat: 37.95, lng: -122.45 },
};

const santaCruzArea: GeographicBounds = {
  sw: { lat: 36.9, lng: -122.1 },
  ne: { lat: 37.0, lng: -121.9 },
};

const activities: ActivitySummary[] = [
  {
    id: 12345,
    name: "Mt Tam via Panoramic Highway",
    distance: 65000,
    elevationGain: 1200,
    movingTime: 10800,
    startLatLng: [37.906, -122.5474],
  },
  {
    id: 12346,
    name: "Hawk Hill and Marin Headlands",
    distance: 42000,
    elevationGain: 750,
    movingTime: 7200,
    startLatLng: [37.8577, -122.4853],
  },
  {
    id: 12347,
    name: "Camino Alto to Paradise Loop",
    distance: 55000,
    elevationGain: 600,
    movingTime: 9000,
    startLatLng: [37.906, -122.5474],
  },
  {
    id: 12348,
    name: "Bolinas Ridge Epic",
    distance: 110000,
    elevationGain: 2200,
    movingTime: 18000,
    startLatLng: [37.906, -122.5474],
  },
];

const segments: SegmentSummary[] = [
  {
    id: 98765,
    name: "Hawk Hill Climb",
    distance: 2100,
    avgGrade: 8.5,
    elevDifference: 178,
  },
  {
    id: 98766,
    name: "Panoramic Highway to Pantoll",
    distance: 5200,
    avgGrade: 5.8,
    elevDifference: 302,
  },
];

const routes = [
  { id: 55555, name: "Mt Tam Loop", distance: 65000, elevationGain: 1200 },
  { id: 55556, name: "Headlands Out and Back", distance: 42000, elevationGain: 750 },
];

const preferences: RidingPreferences = {
  rideCount: 150,
  distance: { avg: 54000, max: 110000 },
  elevation: { avg: 850, max: 2200 },
  duration: { avg: 9000, max: 18000 },
};

function createInput(area: GeographicBounds): HistoryAnalysisInput {
  return { area, activities, segments, routes, preferences };
}

describe("analyzeHistory", () => {
  test("filters activities within the bounding box", () => {
    const result = analyzeHistory(createInput(marinArea));
    expect(result.relevantActivities).toHaveLength(4);
    expect(result.relevantActivities.map((a) => a.id)).toEqual([12345, 12346, 12347, 12348]);
  });

  test("returns no relevant activities for an area with no rides", () => {
    const result = analyzeHistory(createInput(santaCruzArea));
    expect(result.relevantActivities).toHaveLength(0);
  });

  test("passes all segments through as reusable", () => {
    const result = analyzeHistory(createInput(marinArea));
    expect(result.reusableSegments).toEqual(segments);
  });

  test("passes preferences through from input", () => {
    const result = analyzeHistory(createInput(marinArea));
    expect(result.preferences).toEqual(preferences);
  });

  test("handles empty activities", () => {
    const emptyPreferences: RidingPreferences = {
      rideCount: 0,
      distance: { avg: 0, max: 0 },
      elevation: { avg: 0, max: 0 },
      duration: { avg: 0, max: 0 },
    };
    const result = analyzeHistory({
      area: marinArea,
      activities: [],
      segments: [],
      routes: [],
      preferences: emptyPreferences,
    });
    expect(result.relevantActivities).toHaveLength(0);
    expect(result.reusableSegments).toHaveLength(0);
    expect(result.preferences).toEqual(emptyPreferences);
  });
});

describe("buildHistoryPrompt", () => {
  test("includes familiarity context for new territory", () => {
    const output = analyzeHistory(createInput(santaCruzArea));
    const prompt = buildHistoryPrompt(output);
    expect(prompt).toContain("No prior rides");
  });

  test("includes familiarity context for few rides", () => {
    const output = analyzeHistory({
      area: marinArea,
      activities: [activities[0]],
      segments,
      routes,
      preferences,
    });
    const prompt = buildHistoryPrompt(output);
    expect(prompt).toContain("Few prior rides");
  });

  test("omits familiarity context for well-covered area", () => {
    const output = analyzeHistory(createInput(marinArea));
    const prompt = buildHistoryPrompt(output);
    expect(prompt).not.toContain("prior rides");
  });

  test("includes segment context when segments exist", () => {
    const output = analyzeHistory(createInput(marinArea));
    const prompt = buildHistoryPrompt(output);
    expect(prompt).toContain("2 known segments");
  });

  test("omits segment context when no segments", () => {
    const output = analyzeHistory({
      area: marinArea,
      activities,
      segments: [],
      routes,
      preferences,
    });
    const prompt = buildHistoryPrompt(output);
    expect(prompt).not.toContain("segments");
  });
});
