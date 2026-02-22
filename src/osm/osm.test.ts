import { describe, expect, test } from "bun:test";
import { findCyclingInfrastructure, findWaterSources, querySurfaceTypes } from "./overpass";

describe("findWaterSources", () => {
  test("Pantoll Ranger Station area", async () => {
    const results = await findWaterSources({
      south: 37.9015,
      west: -122.6075,
      north: 37.9060,
      east: -122.6010,
    });
    expect(results).toMatchSnapshot();
  }, 15000);
});

describe("findCyclingInfrastructure", () => {
  test("Sausalito near Bridgeway", async () => {
    const results = await findCyclingInfrastructure({
      south: 37.855,
      west: -122.485,
      north: 37.862,
      east: -122.475,
    });
    expect(results).toMatchSnapshot();
  }, 15000);
});

describe("querySurfaceTypes", () => {
  test("Mill Valley - Sausalito bike path", async () => {
    const results = await querySurfaceTypes({
      south: 37.860,
      west: -122.510,
      north: 37.875,
      east: -122.495,
    });
    expect(results).toMatchSnapshot();
  }, 15000);
});
