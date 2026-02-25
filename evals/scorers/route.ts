import type { GradingResult } from "./types";

/**
 * Assert that the output mentions specific geographic locations.
 *
 * Performs case-insensitive substring matching. Partial credit is awarded
 * proportional to the number of locations found.
 *
 * Usage in promptfooconfig.yaml:
 * ```yaml
 * assert:
 *   - type: javascript
 *     value: file://../../evals/scorers/route.ts:mentionsLocations
 *     config:
 *       locations: ["Hawk Hill", "Panoramic Highway", "Stinson Beach"]
 * ```
 */
export function mentionsLocations(
  output: unknown,
  context: { config?: { locations?: string[] } },
): GradingResult {
  const locations = context.config?.locations ?? [];
  if (locations.length === 0) {
    return { pass: false, score: 0, reason: "No locations specified in config" };
  }

  const text = String(output).toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];

  for (const loc of locations) {
    if (text.includes(loc.toLowerCase())) {
      found.push(loc);
    } else {
      missing.push(loc);
    }
  }

  const score = found.length / locations.length;

  if (missing.length === 0) {
    return { pass: true, score: 1, reason: "All locations mentioned" };
  }

  return {
    pass: false,
    score,
    reason: `Missing locations: ${missing.join(", ")}`,
  };
}

/**
 * Assert that the output references expected skills being invoked.
 *
 * Checks for skill names (case-insensitive) in the output text. Useful
 * for end-to-end evals that verify the orchestrator selected the right skills.
 *
 * Usage in promptfooconfig.yaml:
 * ```yaml
 * assert:
 *   - type: javascript
 *     value: file://../../evals/scorers/route.ts:invokesSkills
 *     config:
 *       skills: ["History Analysis", "Climb Planning", "Food Stop Planning"]
 * ```
 */
export function invokesSkills(
  output: unknown,
  context: { config?: { skills?: string[] } },
): GradingResult {
  const skills = context.config?.skills ?? [];
  if (skills.length === 0) {
    return { pass: false, score: 0, reason: "No skills specified in config" };
  }

  const text = String(output).toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];

  for (const skill of skills) {
    if (text.includes(skill.toLowerCase())) {
      found.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const score = found.length / skills.length;

  if (missing.length === 0) {
    return { pass: true, score: 1, reason: "All expected skills referenced" };
  }

  return {
    pass: false,
    score,
    reason: `Missing skill references: ${missing.join(", ")}`,
  };
}

/**
 * Validate distance values in the output against a target with tolerance.
 *
 * Searches for distance-like patterns (e.g., "65 km", "40 miles", "90mi")
 * and checks that at least one falls within the expected range.
 *
 * Usage in promptfooconfig.yaml:
 * ```yaml
 * assert:
 *   - type: javascript
 *     value: file://../../evals/scorers/route.ts:distanceInRange
 *     config:
 *       target_mi: 90
 *       tolerance: 0.15
 * ```
 */
export function distanceInRange(
  output: unknown,
  context: { config?: { target_mi?: number; target_km?: number; tolerance?: number } },
): GradingResult {
  const { target_mi, target_km, tolerance = 0.15 } = context.config ?? {};

  if (target_mi === undefined && target_km === undefined) {
    return { pass: false, score: 0, reason: "Config must specify target_mi or target_km" };
  }

  const targetKm = target_km ?? (target_mi ?? 0) * 1.60934;
  const text = String(output);

  const miPattern = /(\d+(?:\.\d+)?)\s*(?:miles?|mi)\b/gi;
  const kmPattern = /(\d+(?:\.\d+)?)\s*(?:kilometers?|kilometres?|km)\b/gi;

  const distances: number[] = [];
  for (const match of text.matchAll(miPattern)) {
    distances.push(Number.parseFloat(match[1]) * 1.60934);
  }
  for (const match of text.matchAll(kmPattern)) {
    distances.push(Number.parseFloat(match[1]));
  }

  if (distances.length === 0) {
    return { pass: false, score: 0, reason: "No distance values found in output" };
  }

  const minKm = targetKm * (1 - tolerance);
  const maxKm = targetKm * (1 + tolerance);
  const inRange = distances.find((d) => d >= minKm && d <= maxKm);

  if (inRange) {
    return {
      pass: true,
      score: 1,
      reason: `Found distance ${Math.round(inRange)} km within ${tolerance * 100}% of target ${Math.round(targetKm)} km`,
    };
  }

  const closest = distances.reduce((a, b) =>
    Math.abs(a - targetKm) < Math.abs(b - targetKm) ? a : b,
  );
  const ratio = Math.abs(closest - targetKm) / targetKm;

  return {
    pass: false,
    score: Math.max(0, 1 - ratio),
    reason: `Closest distance ${Math.round(closest)} km is ${Math.round(ratio * 100)}% off target ${Math.round(targetKm)} km`,
  };
}
