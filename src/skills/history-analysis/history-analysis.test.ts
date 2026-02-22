import { describe, expect, test } from "bun:test";
import { analyzeHistory } from "./analyze";
import { buildHistoryPrompt } from "./prompt";
import type {
  ActivitySummary,
  GeographicBounds,
  HistoryAnalysisInput,
  SegmentSummary,
} from "./types";

const paloAltoArea: GeographicBounds = {
  sw: { lat: 37.3, lng: -122.2 },
  ne: { lat: 37.5, lng: -122.0 },
};

const sacramentoArea: GeographicBounds = {
  sw: { lat: 38.4, lng: -121.6 },
  ne: { lat: 38.7, lng: -121.3 },
};

const activities: ActivitySummary[] = [
  {
    id: 12345,
    name: "Pescadero Loop via Tunitas Creek",
    distance: 105000,
    elevationGain: 1800,
    movingTime: 14400,
    startLatLng: [37.4419, -122.143],
  },
  {
    id: 12346,
    name: "Conservatory Drive Climb",
    distance: 45000,
    elevationGain: 900,
    movingTime: 7200,
    startLatLng: [37.4419, -122.143],
  },
];

const segments: SegmentSummary[] = [
  {
    id: 98765,
    name: "Tunitas Creek Road Climb",
    distance: 8500,
    avgGrade: 5.2,
    elevDifference: 442,
  },
  {
    id: 98766,
    name: "Stage Road South",
    distance: 12000,
    avgGrade: 2.1,
    elevDifference: 252,
  },
];

const routes = [
  { id: 55555, name: "Pescadero Lunch Ride", distance: 105000, elevationGain: 1800 },
  { id: 55556, name: "Quick Conservatory Loop", distance: 45000, elevationGain: 900 },
];

function createInput(area: GeographicBounds): HistoryAnalysisInput {
  return { area, activities, segments, routes };
}

describe("analyzeHistory", () => {
  test("filters activities within the bounding box", () => {
    const result = analyzeHistory(createInput(paloAltoArea));
    expect(result.relevantActivities).toHaveLength(2);
    expect(result.relevantActivities.map((a) => a.id)).toEqual([12345, 12346]);
  });

  test("returns no relevant activities for an area with no rides", () => {
    const result = analyzeHistory(createInput(sacramentoArea));
    expect(result.relevantActivities).toHaveLength(0);
  });

  test("passes all segments through as reusable", () => {
    const result = analyzeHistory(createInput(paloAltoArea));
    expect(result.reusableSegments).toEqual(segments);
  });

  test("describes familiar roads from matching activities", () => {
    const result = analyzeHistory(createInput(paloAltoArea));
    expect(result.familiarRoads).toHaveLength(2);
    expect(result.familiarRoads[0]).toContain("Pescadero Loop via Tunitas Creek");
    expect(result.familiarRoads[0]).toContain("105.0km");
    expect(result.familiarRoads[0]).toContain("1800m gain");
  });

  test("reports new territory when no activities match", () => {
    const result = analyzeHistory(createInput(sacramentoArea));
    expect(result.familiarRoads).toHaveLength(0);
    expect(result.newOpportunities).toHaveLength(1);
    expect(result.newOpportunities[0]).toContain("new territory");
  });

  test("reports few rides when under threshold", () => {
    const singleActivity: ActivitySummary[] = [activities[0]];
    const result = analyzeHistory({
      area: paloAltoArea,
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
      { ...activities[0], id: 12347, name: "Morning Ride" },
    ];
    const result = analyzeHistory({
      area: paloAltoArea,
      activities: manyActivities,
      segments,
      routes,
    });
    expect(result.newOpportunities).toHaveLength(0);
  });

  test("computes preferences from all activities", () => {
    const result = analyzeHistory(createInput(paloAltoArea));
    expect(result.preferences.avgDistance).toBe(75000);
    expect(result.preferences.avgElevation).toBe(1350);
    expect(result.preferences.avgDuration).toBe(10800);
  });

  test("computes preferences even when no activities match the area", () => {
    const result = analyzeHistory(createInput(sacramentoArea));
    expect(result.preferences.avgDistance).toBe(75000);
    expect(result.preferences.avgElevation).toBe(1350);
  });

  test("handles empty activities", () => {
    const result = analyzeHistory({
      area: paloAltoArea,
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
    const output = analyzeHistory(createInput(sacramentoArea));
    const prompt = buildHistoryPrompt(output);
    expect(prompt).toContain("No prior rides");
  });

  test("includes familiarity context for few rides", () => {
    const output = analyzeHistory({
      area: paloAltoArea,
      activities: [activities[0]],
      segments,
      routes,
    });
    const prompt = buildHistoryPrompt(output);
    expect(prompt).toContain("Few prior rides");
  });

  test("omits familiarity context for well-covered area", () => {
    const output = analyzeHistory({
      area: paloAltoArea,
      activities: [...activities, { ...activities[0], id: 12347, name: "Morning Ride" }],
      segments,
      routes,
    });
    const prompt = buildHistoryPrompt(output);
    expect(prompt).not.toContain("prior rides");
  });

  test("includes segment context when segments exist", () => {
    const output = analyzeHistory(createInput(paloAltoArea));
    const prompt = buildHistoryPrompt(output);
    expect(prompt).toContain("2 known segments");
  });

  test("omits segment context when no segments", () => {
    const output = analyzeHistory({
      area: paloAltoArea,
      activities,
      segments: [],
      routes,
    });
    const prompt = buildHistoryPrompt(output);
    expect(prompt).not.toContain("segments");
  });
});
