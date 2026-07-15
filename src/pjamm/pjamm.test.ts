import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import fetchVCR from "fetch-vcr";
import { fetchClimb, searchClimbs } from "./pjamm";

fetchVCR.configure({
  fixturePath: join(import.meta.dir, "fixtures"),
  mode: process.env.LIVE_API ? "record" : "playback",
  headerBlacklist: ["authorization", "user-agent", "cookie"],
});

const marinBounds = {
  south: 37.82,
  west: -122.75,
  north: 38.1,
  east: -122.43,
};

const southAtlanticBounds = {
  south: -40,
  west: -20,
  north: -30,
  east: -10,
};

const realFetch = globalThis.fetch;
beforeAll(() => {
  globalThis.fetch = fetchVCR as unknown as typeof fetch;
});
afterAll(() => {
  globalThis.fetch = realFetch;
});

describe("fetchClimb", () => {
  test("Alpe d'Huez detail", async () => {
    const climb = await fetchClimb(118);

    expect(climb.name).toBe("Alpe d'Huez");
    expect(climb.narratives.summary).not.toBe("");
    expect(climb.pdi).toBeGreaterThan(0);
    expect(climb.photos.length).toBeGreaterThanOrEqual(1);

    const { narratives, photos, ...stats } = climb;
    expect(stats).toMatchSnapshot();
    expect(photos[0]).toMatchSnapshot();
    expect(narratives.gradient).toMatchSnapshot();
  });

  test("unknown climb id throws", async () => {
    await expect(fetchClimb(9999999)).rejects.toThrow(/PJAMM error/);
  });
});

describe("searchClimbs", () => {
  test("Marin County bounding box", async () => {
    const climbs = await searchClimbs(marinBounds);

    expect(climbs.length).toBeGreaterThanOrEqual(1);
    for (const climb of climbs) {
      expect(climb.lat).toBeGreaterThanOrEqual(marinBounds.south);
      expect(climb.lat).toBeLessThanOrEqual(marinBounds.north);
      expect(climb.lng).toBeGreaterThanOrEqual(marinBounds.west);
      expect(climb.lng).toBeLessThanOrEqual(marinBounds.east);
    }
    expect(climbs.map((climb) => climb.name)).toMatchSnapshot();
  });

  test("open-ocean bounding box matches no zones", async () => {
    expect(await searchClimbs(southAtlanticBounds)).toEqual([]);
  });
});
