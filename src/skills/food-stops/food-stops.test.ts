import { describe, expect, test } from "bun:test";
import { planFoodStops } from "./plan";
import { buildFoodStopPrompt } from "./prompt";
import type { FoodPlace, FoodStopPlanningInput, OpeningHours, RoutePoint } from "./types";

const ALWAYS_OPEN: OpeningHours = {
  0: [{ openMinute: 0, closeMinute: 1440 }],
  1: [{ openMinute: 0, closeMinute: 1440 }],
  2: [{ openMinute: 0, closeMinute: 1440 }],
  3: [{ openMinute: 0, closeMinute: 1440 }],
  4: [{ openMinute: 0, closeMinute: 1440 }],
  5: [{ openMinute: 0, closeMinute: 1440 }],
  6: [{ openMinute: 0, closeMinute: 1440 }],
};

// ~10 km apart in latitude, all at the same longitude.
const route: RoutePoint[] = [
  { lat: 37.0, lon: -122.0 },
  { lat: 37.09, lon: -122.0 },
  { lat: 37.18, lon: -122.0 },
  { lat: 37.27, lon: -122.0 },
  { lat: 37.36, lon: -122.0 },
];

const cafePlace: FoodPlace = {
  id: "1",
  name: "Trailhead Cafe",
  lat: 37.0,
  lon: -122.0,
  rating: 4.2,
  hours: ALWAYS_OPEN,
};
const dinerPlace: FoodPlace = {
  id: "2",
  name: "Midway Diner",
  lat: 37.09,
  lon: -122.001,
  rating: 4.0,
  hours: ALWAYS_OPEN,
};
const snackBarPlace: FoodPlace = {
  id: "3",
  name: "Junction Snack Bar",
  lat: 37.18,
  lon: -121.995,
  rating: 3.8,
  hours: ALWAYS_OPEN,
};
const bistroPlace: FoodPlace = {
  id: "4",
  name: "End Bistro",
  lat: 37.36,
  lon: -122.0,
  rating: 4.9,
  hours: ALWAYS_OPEN,
};
const farawayPlace: FoodPlace = {
  id: "5",
  name: "Faraway Diner",
  lat: 37.15,
  lon: -121.5,
  hours: ALWAYS_OPEN,
};

const corridorStartTime = new Date("2024-01-15T09:00:00Z");

function createInput(overrides?: Partial<FoodStopPlanningInput>): FoodStopPlanningInput {
  return {
    route,
    places: [cafePlace, dinerPlace, snackBarPlace, bistroPlace, farawayPlace],
    startTime: corridorStartTime,
    ...overrides,
  };
}

describe("planFoodStops corridor filtering and ordering", () => {
  test("filters out places beyond the route corridor", () => {
    const result = planFoodStops(createInput());
    expect(result.stops.map((s) => s.place.id)).not.toContain(farawayPlace.id);
  });

  test("orders stops by distance along the route", () => {
    const result = planFoodStops({ ...createInput(), targetSpacingM: 5000 });
    const distances = result.stops.map((s) => s.distanceAlongRouteM);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
    expect(result.stops).toHaveLength(4);
  });

  test("respects a custom corridor distance", () => {
    const result = planFoodStops({ ...createInput(), corridorDistanceM: 100 });
    expect(result.stops.map((s) => s.place.id)).toEqual([cafePlace.id, bistroPlace.id]);
  });
});

describe("planFoodStops spacing", () => {
  test("applies the default target spacing of 40km", () => {
    const result = planFoodStops(createInput());
    expect(result.stops.map((s) => s.place.id)).toEqual([cafePlace.id, bistroPlace.id]);
  });

  test("thins closely spaced places with a custom target spacing", () => {
    const result = planFoodStops({ ...createInput(), targetSpacingM: 15000 });
    expect(result.stops.map((s) => s.place.id)).toEqual([
      cafePlace.id,
      snackBarPlace.id,
      bistroPlace.id,
    ]);
  });

  test("returns no stops when there are no places", () => {
    const result = planFoodStops({ ...createInput(), places: [] });
    expect(result.stops).toHaveLength(0);
    expect(result.totalDistanceM).toBeGreaterThan(0);
  });

  test("resolves averageSpeedKmh in the output", () => {
    expect(planFoodStops(createInput()).averageSpeedKmh).toBe(20);
    expect(planFoodStops({ ...createInput(), averageSpeedKmh: 25 }).averageSpeedKmh).toBe(25);
  });
});

describe("planFoodStops arrival time projection", () => {
  const shortRoute: RoutePoint[] = [
    { lat: 37.0, lon: -122.0 },
    { lat: 37.09, lon: -122.0 },
  ];
  const halfwayPlace: FoodPlace = { id: "h", name: "Halfway Cafe", lat: 37.09, lon: -122.0 };
  const startTime = new Date("2024-01-15T08:00:00Z");

  function closeToMinutes(actual: Date, expected: Date, toleranceMinutes: number) {
    expect(Math.abs(actual.getTime() - expected.getTime())).toBeLessThan(
      toleranceMinutes * 60 * 1000,
    );
  }

  test("projects arrival using the default averageSpeedKmh", () => {
    const result = planFoodStops({ route: shortRoute, places: [halfwayPlace], startTime });
    // ~10km at 20km/h -> ~30 minutes
    closeToMinutes(result.stops[0].arrivalTime, new Date(startTime.getTime() + 30 * 60 * 1000), 2);
  });

  test("projects a later arrival with a slower averageSpeedKmh", () => {
    const result = planFoodStops({
      route: shortRoute,
      places: [halfwayPlace],
      startTime,
      averageSpeedKmh: 10,
    });
    // ~10km at 10km/h -> ~60 minutes
    closeToMinutes(result.stops[0].arrivalTime, new Date(startTime.getTime() + 60 * 60 * 1000), 2);
  });
});

describe("planFoodStops meal classification and hours", () => {
  const zeroRoute: RoutePoint[] = [
    { lat: 37.0, lon: -122.0 },
    { lat: 37.09, lon: -122.0 },
  ];
  const cornerDiner: FoodPlace = { id: "c", name: "Corner Diner", lat: 37.0, lon: -122.0 };

  function planAtStart(startTime: Date, overrides?: Partial<FoodPlace>) {
    return planFoodStops({
      route: zeroRoute,
      places: [{ ...cornerDiner, ...overrides }],
      startTime,
    });
  }

  test("classifies a breakfast-hour arrival as a meal", () => {
    const result = planAtStart(new Date("2024-01-15T07:00:00Z"));
    expect(result.stops[0].mealType).toBe("meal");
  });

  test("classifies a lunch-hour arrival as a meal", () => {
    const result = planAtStart(new Date("2024-01-15T12:00:00Z"));
    expect(result.stops[0].mealType).toBe("meal");
  });

  test("classifies a dinner-hour arrival as a meal", () => {
    const result = planAtStart(new Date("2024-01-15T18:00:00Z"));
    expect(result.stops[0].mealType).toBe("meal");
  });

  test("classifies an off-peak arrival as a snack", () => {
    const result = planAtStart(new Date("2024-01-15T15:30:00Z"));
    expect(result.stops[0].mealType).toBe("snack");
  });

  test("marks a stop open when the arrival falls within business hours", () => {
    const result = planAtStart(new Date("2024-01-15T12:00:00Z"), { hours: ALWAYS_OPEN });
    expect(result.stops[0].isOpenAtArrival).toBe(true);
  });

  test("marks a stop's hours unknown when no hours data is provided", () => {
    const result = planAtStart(new Date("2024-01-15T12:00:00Z"));
    expect(result.stops[0].isOpenAtArrival).toBe("unknown");
  });
});

describe("planFoodStops backup gap-fill", () => {
  // ~100 km, no other candidates in the route.
  // Nearest-route-point matching only checks route vertices, so each place
  // needs a vertex within the corridor distance.
  function buildDenseRoute(segments: number): RoutePoint[] {
    return Array.from({ length: segments + 1 }, (_, i) => ({ lat: 37.0 + i * 0.09, lon: -122.0 }));
  }

  const longRoute = buildDenseRoute(11); // ~110 km, vertices every ~10km
  const sundayOnlyHours: OpeningHours = { 0: [{ openMinute: 0, closeMinute: 1440 }] };
  const depotDeli: FoodPlace = {
    id: "far",
    name: "Depot Deli",
    lat: longRoute[8].lat, // ~80 km
    lon: -122.0,
    rating: 4.0,
    hours: sundayOnlyHours,
  };
  const startTime = new Date("2024-01-15T08:00:00Z"); // Monday

  test("adds a backup stop for a large gap containing only closed candidates", () => {
    const result = planFoodStops({ route: longRoute, places: [depotDeli], startTime });
    expect(result.stops).toHaveLength(1);
    expect(result.stops[0].place.id).toBe(depotDeli.id);
    expect(result.stops[0].isBackup).toBe(true);
    expect(result.stops[0].isOpenAtArrival).toBe(false);
  });

  test("does not add a backup stop when the gap is below the threshold", () => {
    const shortRoute = buildDenseRoute(1); // ~10 km
    const nearbyClosedPlace: FoodPlace = { ...depotDeli, lat: shortRoute[1].lat };
    const result = planFoodStops({ route: shortRoute, places: [nearbyClosedPlace], startTime });
    expect(result.stops).toHaveLength(0);
  });

  test("picks the highest-rated closed candidate as the backup", () => {
    const lowRated: FoodPlace = {
      id: "low",
      name: "Low Rated Deli",
      lat: longRoute[5].lat, // ~50 km
      lon: -122.0,
      rating: 3.0,
      hours: sundayOnlyHours,
    };
    const highRated: FoodPlace = {
      id: "high",
      name: "High Rated Deli",
      lat: longRoute[6].lat, // ~60 km
      lon: -122.0,
      rating: 4.8,
      hours: sundayOnlyHours,
    };
    const result = planFoodStops({ route: longRoute, places: [lowRated, highRated], startTime });
    expect(result.stops).toHaveLength(1);
    expect(result.stops[0].place.id).toBe(highRated.id);
  });
});

describe("buildFoodStopPrompt", () => {
  const zeroRoute: RoutePoint[] = [
    { lat: 37.0, lon: -122.0 },
    { lat: 37.09, lon: -122.0 },
  ];
  const cornerDiner: FoodPlace = { id: "c", name: "Corner Diner", lat: 37.0, lon: -122.0 };

  test("describes a meal stop with time, status, and rating", () => {
    const output = planFoodStops({
      route: zeroRoute,
      places: [{ ...cornerDiner, rating: 4.6, hours: ALWAYS_OPEN }],
      startTime: new Date("2024-01-15T12:00:00Z"),
    });
    const prompt = buildFoodStopPrompt(output);
    expect(prompt).toContain("Lunch at Corner Diner: 0.0 km (arrive ~12:00 PM), open, 4.6★");
  });

  test("labels an off-peak stop as a snack", () => {
    const output = planFoodStops({
      route: zeroRoute,
      places: [{ ...cornerDiner, hours: ALWAYS_OPEN }],
      startTime: new Date("2024-01-15T15:30:00Z"),
    });
    const prompt = buildFoodStopPrompt(output);
    expect(prompt).toContain("Snack at Corner Diner");
  });

  test("flags unknown hours instead of claiming a stop is open", () => {
    const output = planFoodStops({
      route: zeroRoute,
      places: [cornerDiner],
      startTime: new Date("2024-01-15T12:00:00Z"),
    });
    const prompt = buildFoodStopPrompt(output);
    expect(prompt).toContain("hours unknown, verify before relying on it");
    expect(prompt).not.toContain(", open");
  });

  test("phrases a backup stop as closed and suggests packing food", () => {
    const longRoute: RoutePoint[] = Array.from({ length: 12 }, (_, i) => ({
      lat: 37.0 + i * 0.09,
      lon: -122.0,
    })); // ~110 km, vertices every ~10km
    const depotDeli: FoodPlace = {
      id: "far",
      name: "Depot Deli",
      lat: longRoute[8].lat, // ~80 km
      lon: -122.0,
      rating: 4.0,
      hours: { 0: [{ openMinute: 0, closeMinute: 1440 }] },
    };
    const output = planFoodStops({
      route: longRoute,
      places: [depotDeli],
      startTime: new Date("2024-01-15T08:00:00Z"),
    });
    const prompt = buildFoodStopPrompt(output);
    expect(prompt).toContain("Backup only, closed at arrival: Depot Deli");
    expect(prompt).toContain("consider packing food for this stretch");
  });

  test("advises packing food when no stops are found", () => {
    const output = planFoodStops({ route, places: [], startTime: corridorStartTime });
    const prompt = buildFoodStopPrompt(output);
    expect(prompt).toContain("No food stops found");
    expect(prompt).toContain("pack enough food");
  });
});
