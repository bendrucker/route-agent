import { describe, expect, test } from "bun:test";
import { findCyclingInfrastructure, findWaterSources, querySurfaceTypes } from "./overpass";

// Small area around Mitchell Park, Palo Alto — well-mapped and stable
const bounds = {
  south: 37.425,
  west: -122.175,
  north: 37.432,
  east: -122.163,
};

// Very small area for surface query (returns many way elements)
const surfaceBounds = {
  south: 37.427,
  west: -122.172,
  north: 37.429,
  east: -122.168,
};

describe("findWaterSources", () => {
  test("returns water sources from Overpass API", async () => {
    const results = await findWaterSources(bounds);
    expect(results).toMatchSnapshot();
  }, 15000);
});

describe("findCyclingInfrastructure", () => {
  test("returns cycling infrastructure from Overpass API", async () => {
    const results = await findCyclingInfrastructure(bounds);
    expect(results).toMatchSnapshot();
  }, 15000);
});

describe("querySurfaceTypes", () => {
  test("returns road surface types from Overpass API", async () => {
    const results = await querySurfaceTypes(surfaceBounds);
    expect(results).toMatchSnapshot();
  }, 15000);
});
