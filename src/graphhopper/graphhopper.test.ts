import { describe, expect, test } from "bun:test";
import { fetchGeocode, fetchRoute } from "./server";

const apiKey = process.env.GRAPHHOPPER_API_KEY;
const hasKey = Boolean(apiKey);

describe.skipIf(!hasKey)("fetchRoute", () => {
  test("Palo Alto to Half Moon Bay", async () => {
    const path = await fetchRoute(
      apiKey!,
      [
        [37.4419, -122.143],
        [37.4636, -122.4286],
      ],
      "road",
    );

    expect(path.distance).toBeGreaterThan(0);
    expect(path.time).toBeGreaterThan(0);
    expect(path.points.coordinates.length).toBeGreaterThan(0);
    expect(path.instructions.length).toBeGreaterThan(0);

    const snapshot = {
      distance: Math.round(path.distance),
      time: Math.round(path.time),
      coordinateCount: path.points.coordinates.length,
      instructionCount: path.instructions.length,
      firstCoord: path.points.coordinates[0],
      lastCoord: path.points.coordinates[path.points.coordinates.length - 1],
      instructions: path.instructions.map((i) => i.text),
    };

    expect(snapshot).toMatchSnapshot();
  });
});

describe.skipIf(!hasKey)("fetchGeocode", () => {
  test("Palo Alto, CA", async () => {
    const hits = await fetchGeocode(apiKey!, "Palo Alto, CA");

    expect(hits.length).toBeGreaterThan(0);

    const snapshot = hits.map((h) => ({
      name: h.name,
      lat: Math.round(h.point.lat * 1000) / 1000,
      lng: Math.round(h.point.lng * 1000) / 1000,
      country: h.country,
    }));

    expect(snapshot).toMatchSnapshot();
  });
});
