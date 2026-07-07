import { describe, expect, test } from "bun:test";
import { organizeFindings } from "./organize";
import { buildRideReportsPrompt } from "./prompt";
import type { LocalKnowledgeFinding } from "./types";

const forumSource = { url: "https://reddit.com/r/cycling/abc", title: "Mt Diablo ride report" };
const blogSource = {
  url: "https://example-cycling-blog.com/mt-diablo",
  title: "Climbing Mt Diablo",
};

const findings: LocalKnowledgeFinding[] = [
  {
    category: "hazard",
    summary: "Loose gravel on the descent past the north gate",
    source: forumSource,
  },
  {
    category: "hazard",
    summary: "Loose gravel on the descent past the north gate",
    source: blogSource,
  },
  {
    category: "condition",
    summary: "Summit road closed to cars on weekend mornings",
    source: forumSource,
  },
  {
    category: "recommendation",
    summary: "Fill water bottles at the ranger station before the climb",
    source: blogSource,
  },
];

describe("organizeFindings", () => {
  test("groups findings by category", () => {
    const result = organizeFindings(findings);
    expect(result.hazards).toHaveLength(1);
    expect(result.conditions).toHaveLength(1);
    expect(result.recommendations).toHaveLength(1);
  });

  test("dedupes findings with matching summaries, keeping the first source", () => {
    const result = organizeFindings(findings);
    expect(result.hazards[0]?.source).toEqual(forumSource);
  });

  test("dedupe is case-insensitive and trims whitespace", () => {
    const result = organizeFindings([
      { category: "hazard", summary: "  Watch for dogs near the farmhouse  ", source: forumSource },
      { category: "hazard", summary: "watch for dogs near the farmhouse", source: blogSource },
    ]);
    expect(result.hazards).toHaveLength(1);
  });

  test("counts unique sources across all findings", () => {
    const result = organizeFindings(findings);
    expect(result.sourceCount).toBe(2);
  });

  test("handles no findings", () => {
    const result = organizeFindings([]);
    expect(result).toEqual({
      hazards: [],
      conditions: [],
      recommendations: [],
      sourceCount: 0,
    });
  });
});

describe("buildRideReportsPrompt", () => {
  test("names the target area in the search guidance", () => {
    const prompt = buildRideReportsPrompt("Mount Diablo");
    expect(prompt).toContain("Mount Diablo cycling ride report");
  });

  test("directs the agent to extract hazards, conditions, and recommendations", () => {
    const prompt = buildRideReportsPrompt("Mount Diablo");
    expect(prompt).toContain("Hazards:");
    expect(prompt).toContain("Conditions:");
    expect(prompt).toContain("Recommendations:");
  });

  test("requires source attribution", () => {
    const prompt = buildRideReportsPrompt("Mount Diablo");
    expect(prompt).toContain("Attribute every finding");
  });

  test("includes graceful degradation guidance", () => {
    const prompt = buildRideReportsPrompt("Mount Diablo");
    expect(prompt).toContain("If no relevant ride reports or forum posts turn up");
    expect(prompt).toContain("Do not fabricate");
  });
});
