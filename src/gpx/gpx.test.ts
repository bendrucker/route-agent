import { describe, expect, test } from "bun:test";
import type { RoutePath } from "../graphhopper/server";
import { generateGpx } from "./generate";

function createRoutePath(overrides: Partial<RoutePath> = {}): RoutePath {
  return {
    distance: 5000,
    time: 900000,
    points: {
      coordinates: [
        [-122.143, 37.4419, 10],
        [-122.2, 37.41, 45],
        [-122.35, 37.32, 180],
      ],
    },
    instructions: [
      { text: "Head southwest", distance: 2000, time: 360000 },
      { text: "Turn right", distance: 3000, time: 540000 },
    ],
    ...overrides,
  };
}

describe("generateGpx", () => {
  test("produces valid GPX 1.1 with required attributes", () => {
    const gpx = generateGpx(createRoutePath());

    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpx).toContain('version="1.1"');
    expect(gpx).toContain('xmlns="http://www.topografix.com/GPX/1/1"');
    expect(gpx).toContain("xsi:schemaLocation");
    expect(gpx).toContain('creator="route-agent"');
  });

  test("includes track points with lat, lon, and elevation", () => {
    const gpx = generateGpx(createRoutePath());

    expect(gpx).toContain('lat="37.4419" lon="-122.143"');
    expect(gpx).toContain("<ele>10</ele>");
    expect(gpx).toContain('lat="37.41" lon="-122.2"');
    expect(gpx).toContain("<ele>45</ele>");
    expect(gpx).toContain('lat="37.32" lon="-122.35"');
    expect(gpx).toContain("<ele>180</ele>");
  });

  test("uses default name when none provided", () => {
    const gpx = generateGpx(createRoutePath());

    expect(gpx).toContain("<name>Route</name>");
  });

  test("uses custom name and description", () => {
    const gpx = generateGpx(createRoutePath(), {
      name: "Tunitas Creek Loop",
      description: "A scenic ride over the coastal hills",
    });

    expect(gpx).toContain("<name>Tunitas Creek Loop</name>");
    expect(gpx).toContain("<desc>A scenic ride over the coastal hills</desc>");
  });

  test("escapes XML special characters in name and description", () => {
    const gpx = generateGpx(createRoutePath(), {
      name: 'Route with "quotes" & <angles>',
      description: "Tom's route",
    });

    expect(gpx).toContain("<name>Route with &quot;quotes&quot; &amp; &lt;angles&gt;</name>");
    expect(gpx).toContain("<desc>Tom&apos;s route</desc>");
  });

  test("includes timestamps when startTime is provided", () => {
    const startTime = new Date("2026-03-15T08:00:00Z");
    const gpx = generateGpx(createRoutePath(), { startTime });

    expect(gpx).toContain("<time>2026-03-15T08:00:00.000Z</time>");
    const timeMatches = gpx.match(/<time>/g);
    expect(timeMatches).toHaveLength(3);
  });

  test("omits timestamps when startTime is not provided", () => {
    const gpx = generateGpx(createRoutePath());

    expect(gpx).not.toContain("<time>");
  });

  test("timestamps progress monotonically", () => {
    const startTime = new Date("2026-03-15T08:00:00Z");
    const gpx = generateGpx(createRoutePath(), { startTime });

    const times = [...gpx.matchAll(/<time>([^<]+)<\/time>/g)].map((m) => new Date(m[1]).getTime());

    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThan(times[i - 1]);
    }
  });

  test("handles coordinates without elevation", () => {
    const path = createRoutePath({
      points: {
        coordinates: [
          [-122.143, 37.4419],
          [-122.2, 37.41],
        ],
      },
    });

    const gpx = generateGpx(path);

    expect(gpx).toContain('lat="37.4419" lon="-122.143"');
    expect(gpx).not.toContain("<ele>");
  });

  test("handles empty coordinates", () => {
    const path = createRoutePath({
      points: { coordinates: [] },
    });

    const gpx = generateGpx(path);

    expect(gpx).toContain("<trkseg>");
    expect(gpx).toContain("</trkseg>");
    expect(gpx).not.toContain("<trkpt");
  });

  test("ends with a newline", () => {
    const gpx = generateGpx(createRoutePath());
    expect(gpx.endsWith("\n")).toBe(true);
  });

  test("snapshot", () => {
    const gpx = generateGpx(createRoutePath(), {
      name: "Skyline Boulevard",
      description: "Palo Alto to Half Moon Bay",
      startTime: new Date("2026-03-15T08:00:00Z"),
    });

    expect(gpx).toMatchSnapshot();
  });
});
