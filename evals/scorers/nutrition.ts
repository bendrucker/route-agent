import { extractJson } from "./json";
import type { GradingResult } from "./types";

interface NutritionOutput {
  calories?: number;
  carbs_g?: number;
  protein_g?: number;
  fat_g?: number;
  serving_size?: string;
  confidence?: string;
}

const REQUIRED_FIELDS: (keyof NutritionOutput)[] = [
  "calories",
  "carbs_g",
  "protein_g",
  "fat_g",
  "serving_size",
  "confidence",
];

/**
 * Validate that the output contains a complete nutrition facts response
 * with all required fields.
 *
 * Usage in promptfooconfig.yaml:
 * ```yaml
 * assert:
 *   - type: javascript
 *     value: file://../../evals/scorers/nutrition.ts:completeNutrition
 * ```
 */
export function completeNutrition(output: unknown): GradingResult {
  const { value, error } = extractJson(output);
  if (error) {
    return { pass: false, score: 0, reason: error };
  }

  const data = value as Record<string, unknown>;
  const missing = REQUIRED_FIELDS.filter((f) => !(f in data));

  if (missing.length > 0) {
    return {
      pass: false,
      score: (REQUIRED_FIELDS.length - missing.length) / REQUIRED_FIELDS.length,
      reason: `Missing nutrition fields: ${missing.join(", ")}`,
    };
  }

  return { pass: true, score: 1, reason: "All nutrition fields present" };
}

/**
 * Validate calorie estimate with partial credit for close values.
 *
 * Returns full credit when within range, partial credit that degrades
 * linearly up to `tolerance` calories away (default 100).
 *
 * Usage in promptfooconfig.yaml:
 * ```yaml
 * assert:
 *   - type: javascript
 *     value: file://../../evals/scorers/nutrition.ts:calorieEstimate
 *     config:
 *       min: 200
 *       max: 300
 *       tolerance: 100
 * ```
 */
export function calorieEstimate(
  output: unknown,
  context: { config?: { min?: number; max?: number; tolerance?: number } },
): GradingResult {
  const { min, max, tolerance = 100 } = context.config ?? {};
  if (min === undefined || max === undefined) {
    return { pass: false, score: 0, reason: "Config must specify min and max calories" };
  }

  const { value, error } = extractJson(output);
  if (error) {
    return { pass: false, score: 0, reason: error };
  }

  const data = value as NutritionOutput;
  if (typeof data.calories !== "number") {
    return { pass: false, score: 0, reason: "calories field is not a number" };
  }

  if (data.calories >= min && data.calories <= max) {
    return { pass: true, score: 1, reason: `Calories ${data.calories} within [${min}, ${max}]` };
  }

  const distance = Math.min(Math.abs(data.calories - min), Math.abs(data.calories - max));
  const score = Math.max(0, 1 - distance / tolerance);

  return {
    pass: false,
    score,
    reason: `Calories ${data.calories} outside [${min}, ${max}] (distance: ${distance})`,
  };
}

/**
 * Assert that macronutrient grams are self-consistent with calorie count.
 *
 * Computes calories from macros using standard conversion factors
 * (carbs: 4 cal/g, protein: 4 cal/g, fat: 9 cal/g) and checks that
 * the sum is within a tolerance of the reported calorie value.
 *
 * Usage in promptfooconfig.yaml:
 * ```yaml
 * assert:
 *   - type: javascript
 *     value: file://../../evals/scorers/nutrition.ts:macroConsistency
 *     config:
 *       tolerance: 0.2
 * ```
 */
export function macroConsistency(
  output: unknown,
  context: { config?: { tolerance?: number } },
): GradingResult {
  const tolerance = context.config?.tolerance ?? 0.2;

  const { value, error } = extractJson(output);
  if (error) {
    return { pass: false, score: 0, reason: error };
  }

  const data = value as NutritionOutput;
  if (
    typeof data.calories !== "number" ||
    typeof data.carbs_g !== "number" ||
    typeof data.protein_g !== "number" ||
    typeof data.fat_g !== "number"
  ) {
    return { pass: false, score: 0, reason: "Missing or non-numeric macro fields" };
  }

  const computed = data.carbs_g * 4 + data.protein_g * 4 + data.fat_g * 9;
  const ratio = Math.abs(computed - data.calories) / data.calories;

  if (ratio <= tolerance) {
    return {
      pass: true,
      score: 1,
      reason: `Macro-derived calories (${Math.round(computed)}) within ${tolerance * 100}% of reported (${data.calories})`,
    };
  }

  return {
    pass: false,
    score: Math.max(0, 1 - ratio),
    reason: `Macro-derived calories (${Math.round(computed)}) differ from reported (${data.calories}) by ${Math.round(ratio * 100)}%`,
  };
}

/**
 * Assert that the confidence field matches an expected value.
 *
 * Usage in promptfooconfig.yaml:
 * ```yaml
 * assert:
 *   - type: javascript
 *     value: file://../../evals/scorers/nutrition.ts:confidenceLevel
 *     config:
 *       expected: "exact"
 * ```
 */
export function confidenceLevel(
  output: unknown,
  context: { config?: { expected?: string } },
): GradingResult {
  const expected = context.config?.expected;
  if (!expected) {
    return { pass: false, score: 0, reason: "Config must specify expected confidence level" };
  }

  const { value, error } = extractJson(output);
  if (error) {
    return { pass: false, score: 0, reason: error };
  }

  const data = value as NutritionOutput;
  if (data.confidence === expected) {
    return { pass: true, score: 1, reason: `Confidence is "${expected}"` };
  }

  return {
    pass: false,
    score: 0,
    reason: `Expected confidence "${expected}", got "${data.confidence}"`,
  };
}
