import { describe, expect, test } from "bun:test";
import type { RideReportsSummary } from "../ride-reports";
import { buildNarrativePrompt } from "./prompt";
import { synthesizeNarrative } from "./synthesize";
import type { NarrativeResearchOutput, RoutePlace } from "./types";

const forumSource = { url: "https://reddit.com/r/cycling/abc", title: "Mt Diablo ride report" };
const blogSource = {
  url: "https://example-cycling-blog.com/mt-diablo",
  title: "Climbing Mt Diablo",
};

const summary: RideReportsSummary = {
  hazards: [
    {
      category: "hazard",
      summary: "Loose gravel on the descent past the North Gate",
      source: forumSource,
    },
  ],
  conditions: [
    {
      category: "condition",
      summary: "Summit road closed to cars on weekend mornings",
      source: forumSource,
    },
  ],
  recommendations: [
    {
      category: "recommendation",
      summary: "Fill water bottles at the ranger station before the climb",
      source: blogSource,
    },
  ],
  sourceCount: 2,
};

const places: RoutePlace[] = [
  { name: "North Gate", kind: "landmark" },
  { name: "Ranger Station", kind: "landmark" },
];

describe("synthesizeNarrative", () => {
  test("orders notes hazards, then conditions, then recommendations", () => {
    const result = synthesizeNarrative(summary, places);
    expect(result.notes.map((n) => n.category)).toEqual(["hazard", "condition", "recommendation"]);
  });

  test("matches place case-insensitively as a substring of the summary", () => {
    const result = synthesizeNarrative(summary, places);
    expect(result.notes[0]?.place).toBe("North Gate");
    expect(result.notes[2]?.place).toBe("Ranger Station");
  });

  test("leaves place undefined when nothing matches", () => {
    const result = synthesizeNarrative(summary, places);
    expect(result.notes[1]?.place).toBeUndefined();
  });

  test("leaves place undefined when no places are given", () => {
    const result = synthesizeNarrative(summary);
    expect(result.notes.every((n) => n.place === undefined)).toBe(true);
  });

  test("passes sourceCount through unchanged", () => {
    const result = synthesizeNarrative(summary, places);
    expect(result.sourceCount).toBe(2);
  });

  test("handles an empty summary", () => {
    const result = synthesizeNarrative({
      hazards: [],
      conditions: [],
      recommendations: [],
      sourceCount: 0,
    });
    expect(result).toEqual({ notes: [], sourceCount: 0 });
  });
});

describe("buildNarrativePrompt", () => {
  const output: NarrativeResearchOutput = synthesizeNarrative(summary, places);

  test("includes the core weave-not-appendix instruction", () => {
    const prompt = buildNarrativePrompt(output);
    expect(prompt).toContain("not a research appendix");
    expect(prompt).toContain("local-intel voice");
  });

  test("includes note lines with place and source attribution", () => {
    const prompt = buildNarrativePrompt(output);
    expect(prompt).toContain(
      "hazard near North Gate: Loose gravel on the descent past the North Gate (per Mt Diablo ride report)",
    );
    expect(prompt).toContain(
      "recommendation near Ranger Station: Fill water bottles at the ranger station before the climb (per Climbing Mt Diablo)",
    );
  });

  test("omits place from a note line when nothing matched", () => {
    const prompt = buildNarrativePrompt(output);
    expect(prompt).toContain(
      "condition: Summit road closed to cars on weekend mornings (per Mt Diablo ride report)",
    );
  });

  test("omits degradation guidance when there are notes", () => {
    const prompt = buildNarrativePrompt(output);
    expect(prompt).not.toContain("Skip narrative notes entirely");
  });

  test("emits degradation guidance instead of note lines when there are none", () => {
    const prompt = buildNarrativePrompt({ notes: [], sourceCount: 0 });
    expect(prompt).toContain("Skip narrative notes entirely");
    expect(prompt).toContain("present the route on the strength of the other research");
  });
});
