import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import fetchVCR from "fetch-vcr";
import { findPlaces } from "./places";

fetchVCR.configure({
  fixturePath: join(import.meta.dir, "fixtures"),
  mode: process.env.LIVE_API ? "record" : "playback",
  headerBlacklist: ["authorization", "user-agent", "x-goog-api-key"],
});

const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? "test-key";

const pescaderoBounds = {
  south: 37.2,
  west: -122.42,
  north: 37.3,
  east: -122.32,
};

const realFetch = globalThis.fetch;
beforeAll(() => {
  globalThis.fetch = fetchVCR as unknown as typeof fetch;
});
afterAll(() => {
  globalThis.fetch = realFetch;
});

describe("findPlaces", () => {
  test("coffee near Pescadero", async () => {
    const results = await findPlaces(apiKey, pescaderoBounds, "coffee");
    expect(results).toMatchSnapshot();
  });

  test("no results for a nonsense query", async () => {
    const results = await findPlaces(apiKey, pescaderoBounds, "asdfqwertyzxcvnonexistentplace");
    expect(results).toMatchSnapshot();
  });

  test("open now near Pescadero", async () => {
    const results = await findPlaces(apiKey, pescaderoBounds, "restaurant", true);
    expect(results).toMatchSnapshot();
  });
});
