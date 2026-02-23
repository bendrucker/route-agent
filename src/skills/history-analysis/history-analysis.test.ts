import { describe, expect, test } from "bun:test";
import { analyzeHistory } from "./analyze";
import { buildHistoryPrompt } from "./prompt";
import type {
  ActivitySummary,
  GeographicBounds,
  HistoryAnalysisInput,
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

function createInput(area: GeographicBounds): HistoryAnalysisInput {
  return { area, activities, segments, routes };
}

describe("analyzeHistory", () => {
  test("filters activities within the bounding box", () => {
    const result = analyzeHistory(createInput(marinArea));
    expect(result.relevantActivities).toHaveLength(2);
    expect(result.relevantActivities.map((a) => a.id)).toEqual([12345, 12346]);
  });

  test("returns no relevant activities for an area with no rides", () => {
    const result = analyzeHistory(createInput(santaCruzArea));
    expect(result.relevantActivities).toHaveLength(0);
  });

  test("passes all segments through as reusable", () => {
    const result = analyzeHistory(createInput(marinArea));
    expect(result.reusableSegments).toEqual(segments);
  });

  test("describes familiar roads from matching activities", () => {
    const result = analyzeHistory(createInput(marinArea));
    expect(result.familiarRoads).toHaveLength(2);
    expect(result.familiarRoads[0]).toContain("Mt Tam via Panoramic Highway");
    expect(result.familiarRoads[0]).toContain("65.0km");
    expect(result.familiarRoads[0]).toContain("1200m gain");
  });

  test("reports new territory when no activities match", () => {
    const result = analyzeHistory(createInput(santaCruzArea));
    expect(result.familiarRoads).toHaveLength(0);
    expect(result.newOpportunities).toHaveLength(1);
    expect(result.newOpportunities[0]).toContain("new territory");
  });

  test("reports few rides when under threshold", () => {
    const singleActivity: ActivitySummary[] = [activities[0]];
    const result = analyzeHistory({
      area: marinArea,
      activities: singleActivity,
      segments,
      routes,
    });
    expect(result.newOpportunities).toHaveLength(1);
    expect(result.newOpportunities[0]).toContain("Few rides");
  });

  test("reports no new opportunities when area is well-covered", () => {
    const manyActivities: ActivitySummary[] = [
      ...activities,
      { ...activities[0], id: 12347, name: "Camino Alto to Paradise Loop" },
    ];
    const result = analyzeHistory({
      area: marinArea,
      activities: manyActivities,
      segments,
      routes,
    });
    expect(result.newOpportunities).toHaveLength(0);
  });

  test("computes preferences from all activities", () => {
    const result = analyzeHistory(createInput(marinArea));
    expect(result.preferences.avgDistance).toBe(53500);
    expect(result.preferences.avgElevation).toBe(975);
    expect(result.preferences.avgDuration).toBe(9000);
  });

  test("computes preferences even when no activities match the area", () => {
    const result = analyzeHistory(createInput(santaCruzArea));
    expect(result.preferences.avgDistance).toBe(53500);
    expect(result.preferences.avgElevation).toBe(975);
  });

  test("handles empty activities", () => {
    const result = analyzeHistory({
      area: marinArea,
      activities: [],
      segments: [],
      routes: [],
    });
    expect(result.relevantActivities).toHaveLength(0);
    expect(result.reusableSegments).toHaveLength(0);
    expect(result.familiarRoads).toHaveLength(0);
    expect(result.newOpportunities).toHaveLength(1);
    expect(result.preferences.avgDistance).toBe(0);
    expect(result.preferences.avgElevation).toBe(0);
    expect(result.preferences.avgDuration).toBe(0);
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
    });
    const prompt = buildHistoryPrompt(output);
    expect(prompt).toContain("Few prior rides");
  });

  test("omits familiarity context for well-covered area", () => {
    const output = analyzeHistory({
      area: marinArea,
      activities: [
        ...activities,
        { ...activities[0], id: 12347, name: "Camino Alto to Paradise Loop" },
      ],
      segments,
      routes,
    });
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
    });
    const prompt = buildHistoryPrompt(output);
    expect(prompt).not.toContain("segments");
  });
});
