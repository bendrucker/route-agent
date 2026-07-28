import { describe, expect, test } from "bun:test";
import { difficultyTier, planClimbs } from "./plan";
import { buildClimbPrompt } from "./prompt";
import type { ClimbCandidate } from "./types";

let nextId = 1;

function createClimb(overrides: Partial<ClimbCandidate> = {}): ClimbCandidate {
  const id = overrides.id ?? nextId++;
  return {
    id,
    name: `Climb ${id}`,
    lat: 37.0,
    lng: -122.0,
    country: "USA",
    state: "CA",
    city: "Somewhere",
    distanceMi: 5,
    elevGainFt: 2000,
    avgGradePercent: 6,
    fiets: 5,
    pdi: 10,
    ...overrides,
  };
}

describe("difficultyTier", () => {
  test("classifies boundary values", () => {
    expect(difficultyTier(7.99)).toBe("easy");
    expect(difficultyTier(8)).toBe("moderate");
    expect(difficultyTier(14.99)).toBe("moderate");
    expect(difficultyTier(15)).toBe("hard");
    expect(difficultyTier(24.99)).toBe("hard");
    expect(difficultyTier(25)).toBe("epic");
  });
});

describe("planClimbs", () => {
  test("filters climbs outside the bounds", () => {
    const inBounds = createClimb({ id: 1, lat: 37.0, lng: -122.0 });
    const outOfBounds = createClimb({ id: 2, lat: 40.0, lng: -122.0 });
    const result = planClimbs({
      climbs: [inBounds, outOfBounds],
      bounds: { south: 36.0, west: -123.0, north: 38.0, east: -121.0 },
    });
    expect(result.picks.map((p) => p.climb.id)).toEqual([1]);
  });

  test("includes climbs on the bounds edge", () => {
    const onEdge = createClimb({ id: 1, lat: 36.0, lng: -123.0 });
    const result = planClimbs({
      climbs: [onEdge],
      bounds: { south: 36.0, west: -123.0, north: 38.0, east: -121.0 },
    });
    expect(result.picks.map((p) => p.climb.id)).toEqual([1]);
  });

  test("flags already-ridden climbs", () => {
    const ridden = createClimb({ id: 1, pdi: 20 });
    const fresh = createClimb({ id: 2, pdi: 10 });
    const result = planClimbs({
      climbs: [ridden, fresh],
      riddenClimbIds: [1],
    });
    const riddenPick = result.picks.find((p) => p.climb.id === 1);
    const freshPick = result.picks.find((p) => p.climb.id === 2);
    expect(riddenPick?.alreadyRidden).toBe(true);
    expect(freshPick?.alreadyRidden).toBe(false);
  });

  test("excludes ridden climbs when newClimbsOnly is set", () => {
    const ridden = createClimb({ id: 1, pdi: 20 });
    const fresh = createClimb({ id: 2, pdi: 10 });
    const result = planClimbs({
      climbs: [ridden, fresh],
      riddenClimbIds: [1],
      preferences: { newClimbsOnly: true },
    });
    expect(result.picks.map((p) => p.climb.id)).toEqual([2]);
  });

  test("prefers the exact target tier over higher pdi in other tiers", () => {
    const easy = createClimb({ id: 1, pdi: 5 });
    const moderate = createClimb({ id: 2, pdi: 10 });
    const epic = createClimb({ id: 3, pdi: 30 });
    const result = planClimbs({
      climbs: [easy, moderate, epic],
      preferences: { targetDifficulty: "moderate", maxClimbs: 1 },
    });
    expect(result.picks.map((p) => p.climb.id)).toEqual([2]);
  });

  test("defaults maxClimbs to 3", () => {
    const climbs = [1, 2, 3, 4, 5].map((id) => createClimb({ id, pdi: id }));
    const result = planClimbs({ climbs });
    expect(result.picks).toHaveLength(3);
  });

  test("respects an explicit maxClimbs override", () => {
    const climbs = [1, 2, 3, 4, 5].map((id) => createClimb({ id, pdi: id }));
    const result = planClimbs({ climbs, preferences: { maxClimbs: 2 } });
    expect(result.picks).toHaveLength(2);
  });

  test("selects the highest pdi climbs by default", () => {
    const climbs = [1, 2, 3, 4, 5].map((id) => createClimb({ id, pdi: id }));
    const result = planClimbs({ climbs, preferences: { maxClimbs: 2 } });
    expect(result.picks.map((p) => p.climb.id).sort()).toEqual([4, 5]);
  });

  test("sequences hardest-first in descending pdi order", () => {
    const climbs = [
      createClimb({ id: 1, pdi: 10 }),
      createClimb({ id: 2, pdi: 20 }),
      createClimb({ id: 3, pdi: 15 }),
    ];
    const result = planClimbs({ climbs, preferences: { sequencing: "hardest-first" } });
    expect(result.picks.map((p) => p.climb.id)).toEqual([2, 3, 1]);
    expect(result.picks.map((p) => p.order)).toEqual([1, 2, 3]);
  });

  test("sequences save-legs in ascending pdi order", () => {
    const climbs = [
      createClimb({ id: 1, pdi: 10 }),
      createClimb({ id: 2, pdi: 20 }),
      createClimb({ id: 3, pdi: 15 }),
    ];
    const result = planClimbs({ climbs, preferences: { sequencing: "save-legs" } });
    expect(result.picks.map((p) => p.climb.id)).toEqual([1, 3, 2]);
    expect(result.picks.map((p) => p.order)).toEqual([1, 2, 3]);
  });

  test("splits alternates into easier and harder tiers around the hardest pick", () => {
    const veryEasy = createClimb({ id: 1, pdi: 2 });
    const easy = createClimb({ id: 2, pdi: 6 });
    const pick = createClimb({ id: 3, pdi: 20 });
    const hard = createClimb({ id: 4, pdi: 26 });
    const veryHard = createClimb({ id: 5, pdi: 30 });
    const result = planClimbs({
      climbs: [veryEasy, easy, pick, hard, veryHard],
      preferences: { targetDifficulty: "hard", maxClimbs: 1 },
    });
    expect(result.picks.map((p) => p.climb.id)).toEqual([3]);
    expect(result.alternates.easier.map((c) => c.id)).toEqual([2, 1]);
    expect(result.alternates.harder.map((c) => c.id)).toEqual([4, 5]);
  });

  test("caps alternates at two per side", () => {
    const pick = createClimb({ id: 1, pdi: 20 });
    const easierClimbs = [2, 3, 4].map((id) => createClimb({ id, pdi: id }));
    const result = planClimbs({
      climbs: [pick, ...easierClimbs],
      preferences: { maxClimbs: 1 },
    });
    expect(result.alternates.easier).toHaveLength(2);
  });

  test("sums elevation gain across picks", () => {
    const climbs = [
      createClimb({ id: 1, pdi: 20, elevGainFt: 1000 }),
      createClimb({ id: 2, pdi: 15, elevGainFt: 1500 }),
    ];
    const result = planClimbs({ climbs, preferences: { maxClimbs: 2 } });
    expect(result.totalElevGainFt).toBe(2500);
  });

  test("returns an empty plan for empty input", () => {
    const result = planClimbs({ climbs: [] });
    expect(result.picks).toHaveLength(0);
    expect(result.alternates.easier).toHaveLength(0);
    expect(result.alternates.harder).toHaveLength(0);
    expect(result.totalElevGainFt).toBe(0);
  });
});

describe("buildClimbPrompt", () => {
  test("lists picks in order with formatted stats", () => {
    const output = planClimbs({
      climbs: [
        createClimb({
          id: 1,
          name: "Alpe d'Huez",
          pdi: 26,
          elevGainFt: 3543,
          distanceMi: 8.7,
          avgGradePercent: 7.7,
        }),
      ],
    });
    const prompt = buildClimbPrompt(output);
    expect(prompt).toContain("1. Alpe d'Huez — 8.7 mi at 7.7%, 3543 ft gain (PDI 26.0, epic)");
  });

  test("orders pick lines by ride order", () => {
    const output = planClimbs({
      climbs: [
        createClimb({ id: 1, name: "First", pdi: 20 }),
        createClimb({ id: 2, name: "Second", pdi: 10 }),
      ],
      preferences: { sequencing: "hardest-first", maxClimbs: 2 },
    });
    const prompt = buildClimbPrompt(output);
    expect(prompt.indexOf("1. First")).toBeLessThan(prompt.indexOf("2. Second"));
  });

  test("marks already-ridden climbs", () => {
    const output = planClimbs({
      climbs: [createClimb({ id: 1, name: "Alpe d'Huez", pdi: 20 })],
      riddenClimbIds: [1],
    });
    const prompt = buildClimbPrompt(output);
    expect(prompt).toContain(
      "Alpe d'Huez — 5.0 mi at 6.0%, 2000 ft gain (PDI 20.0, hard) — ridden before",
    );
  });

  test("shows the empty-coverage message when nothing matched", () => {
    const output = planClimbs({ climbs: [] });
    const prompt = buildClimbPrompt(output);
    expect(prompt).toContain("No documented climbs matched the request");
    expect(prompt).toContain("widening the search area");
  });

  test("includes effort guidance at or above 3000 ft of gain", () => {
    const output = planClimbs({
      climbs: [createClimb({ id: 1, pdi: 20, elevGainFt: 3000 })],
    });
    const prompt = buildClimbPrompt(output);
    expect(prompt).toContain("big elevation day");
  });

  test("omits effort guidance below 3000 ft of gain", () => {
    const output = planClimbs({
      climbs: [createClimb({ id: 1, pdi: 20, elevGainFt: 2999 })],
    });
    const prompt = buildClimbPrompt(output);
    expect(prompt).not.toContain("big elevation day");
  });

  test("includes alternates lines when present", () => {
    const output = planClimbs({
      climbs: [
        createClimb({ id: 1, name: "Pick", pdi: 20 }),
        createClimb({ id: 2, name: "Easier Option", pdi: 5 }),
        createClimb({ id: 3, name: "Harder Option", pdi: 30 }),
      ],
      preferences: { targetDifficulty: "hard", maxClimbs: 1 },
    });
    const prompt = buildClimbPrompt(output);
    expect(prompt).toContain("If the plan feels too hard, consider: Easier Option (PDI 5.0)");
    expect(prompt).toContain("To push harder, consider: Harder Option (PDI 30.0)");
  });
});
