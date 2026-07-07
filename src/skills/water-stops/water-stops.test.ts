import { describe, expect, test } from "bun:test";
import { planWaterStops } from "./plan";
import { buildWaterStopPrompt } from "./prompt";
import type { RoutePoint, WaterSource, WaterStopPlanningInput } from "./types";

// ~10 km apart in latitude, all at the same longitude.
const route: RoutePoint[] = [
  { lat: 37.0, lon: -122.0 },
  { lat: 37.09, lon: -122.0 },
  { lat: 37.18, lon: -122.0 },
  { lat: 37.27, lon: -122.0 },
  { lat: 37.36, lon: -122.0 },
];

const startFountain: WaterSource = {
  id: 1,
  lat: 37.0,
  lon: -122.0,
  type: "drinking_water",
  name: "Trailhead Fountain",
};

const tenKmSource: WaterSource = { id: 2, lat: 37.09, lon: -122.001, type: "drinking_water" };
const twentyKmSource: WaterSource = { id: 3, lat: 37.18, lon: -121.995, type: "water_point" };
const fortyKmSource: WaterSource = { id: 4, lat: 37.36, lon: -122.0, type: "drinking_water" };
const offCorridorSource: WaterSource = { id: 5, lat: 37.15, lon: -121.5, type: "drinking_water" };

const waterSources = [startFountain, tenKmSource, twentyKmSource, fortyKmSource, offCorridorSource];

function createInput(isHotWeather: boolean): WaterStopPlanningInput {
  return { route, waterSources, isHotWeather };
}

function closeToKm(actualM: number, expectedKm: number) {
  expect(Math.abs(actualM - expectedKm * 1000)).toBeLessThan(500);
}

describe("planWaterStops", () => {
  test("filters out sources beyond the route corridor", () => {
    const result = planWaterStops(createInput(false));
    expect(result.stops.map((s) => s.source.id)).not.toContain(offCorridorSource.id);
  });

  test("orders stops by distance along the route", () => {
    const result = planWaterStops(createInput(true));
    const distances = result.stops.map((s) => s.distanceAlongRouteM);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  test("thins closely spaced sources in normal weather", () => {
    const result = planWaterStops(createInput(false));
    expect(result.stops.map((s) => s.source.id)).toEqual([
      startFountain.id,
      twentyKmSource.id,
      fortyKmSource.id,
    ]);
    closeToKm(result.stops[0].distanceAlongRouteM, 0);
    closeToKm(result.stops[1].distanceAlongRouteM, 20);
    closeToKm(result.stops[2].distanceAlongRouteM, 40);
  });

  test("allows closer spacing in hot weather", () => {
    const result = planWaterStops(createInput(true));
    expect(result.stops.map((s) => s.source.id)).toEqual([
      startFountain.id,
      tenKmSource.id,
      twentyKmSource.id,
      fortyKmSource.id,
    ]);
  });

  test("respects a custom corridor distance", () => {
    const result = planWaterStops({ ...createInput(false), corridorDistanceM: 100 });
    expect(result.stops.map((s) => s.source.id)).toEqual([startFountain.id, fortyKmSource.id]);
  });

  test("respects custom spacing overrides", () => {
    const result = planWaterStops({ ...createInput(false), normalSpacingM: 5000 });
    expect(result.stops).toHaveLength(4);
  });

  test("returns no stops when the corridor has no water sources", () => {
    const result = planWaterStops({ ...createInput(true), waterSources: [] });
    expect(result.stops).toHaveLength(0);
    expect(result.totalDistanceM).toBeGreaterThan(0);
  });
});

describe("buildWaterStopPrompt", () => {
  test("includes hot weather emphasis", () => {
    const output = planWaterStops(createInput(true));
    const prompt = buildWaterStopPrompt(output);
    expect(prompt).toContain("Hot weather");
  });

  test("omits hot weather emphasis in normal conditions", () => {
    const output = planWaterStops(createInput(false));
    const prompt = buildWaterStopPrompt(output);
    expect(prompt).not.toContain("Hot weather");
  });

  test("describes each stop with a distance marker", () => {
    const output = planWaterStops(createInput(false));
    const prompt = buildWaterStopPrompt(output);
    expect(prompt).toContain("Refill at Trailhead Fountain: 0.0 km");
  });

  test("flags unmarked water points for verification", () => {
    const output = planWaterStops(createInput(false));
    const prompt = buildWaterStopPrompt(output);
    expect(prompt).toContain("unmarked source");
  });

  test("advises carrying extra water when the corridor has no sources", () => {
    const output = planWaterStops({ ...createInput(true), waterSources: [] });
    const prompt = buildWaterStopPrompt(output);
    expect(prompt).toContain("No water sources found");
    expect(prompt).toContain("carrying extra water");
  });
});
