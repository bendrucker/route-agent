import { describe, expect, test } from "bun:test";
import { findCyclingInfrastructure, findWaterSources, querySurfaceTypes } from "./overpass";

const live = describe.skipIf(!process.env.LIVE_API);

live("findWaterSources", () => {
  test("Pantoll Ranger Station area", async () => {
    const results = await findWaterSources({
      south: 37.9015,
      west: -122.6075,
      north: 37.906,
      east: -122.601,
    });
    expect(results).toMatchSnapshot();
  }, 15000);
});

live("findCyclingInfrastructure", () => {
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

live("querySurfaceTypes", () => {
  test("Mill Valley - Sausalito bike path", async () => {
    const results = await querySurfaceTypes({
      south: 37.86,
      west: -122.51,
      north: 37.875,
      east: -122.495,
    });
    expect(results).toMatchSnapshot();
  }, 15000);
});
