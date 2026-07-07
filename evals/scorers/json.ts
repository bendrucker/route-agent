import type { GradingResult } from "./types";

/**
 * Extract and parse JSON from LLM output.
 *
 * Handles both raw JSON strings and JSON embedded in markdown code fences.
 * Promptfoo auto-parses pure JSON output, so `output` may already be an object.
 */
export function extractJson(output: unknown): { value: unknown; error?: string } {
  if (typeof output === "object" && output !== null) {
    return { value: output };
  }

  const text = String(output);
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  const candidate = fenced ? fenced[1] : text;

  try {
    return { value: JSON.parse(candidate) };
  } catch {
    return { value: null, error: "Output does not contain valid JSON" };
  }
}

/**
 * Assert that the output contains valid JSON with all required keys.
 *
 * Usage in promptfooconfig.yaml:
 * ```yaml
 * assert:
 *   - type: javascript
 *     value: file://../../evals/scorers/json.ts:hasKeys
 *     config:
 *       keys: ["calories", "carbs_g", "protein_g"]
 * ```
 */
export function hasKeys(output: unknown, context: { config?: { keys?: string[] } }): GradingResult {
  const keys = context.config?.keys ?? [];
  if (keys.length === 0) {
    return { pass: false, score: 0, reason: "No keys specified in config" };
  }

  const { value, error } = extractJson(output);
  if (error) {
    return { pass: false, score: 0, reason: error };
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { pass: false, score: 0, reason: "Output is not a JSON object" };
  }

  const record = value as Record<string, unknown>;
  const missing = keys.filter((k) => !(k in record));

  if (missing.length > 0) {
    return {
      pass: false,
      score: (keys.length - missing.length) / keys.length,
      reason: `Missing keys: ${missing.join(", ")}`,
    };
  }

  return { pass: true, score: 1, reason: "All required keys present" };
}

/**
 * Assert that numeric fields in the JSON output fall within expected ranges.
 *
 * Usage in promptfooconfig.yaml:
 * ```yaml
 * assert:
 *   - type: javascript
 *     value: file://../../evals/scorers/json.ts:numericRanges
 *     config:
 *       ranges:
 *         calories: { min: 200, max: 300 }
 *         protein_g: { min: 5 }
 * ```
 */
export function numericRanges(
  output: unknown,
  context: { config?: { ranges?: Record<string, { min?: number; max?: number }> } },
): GradingResult {
  const ranges = context.config?.ranges ?? {};
  const fields = Object.keys(ranges);
  if (fields.length === 0) {
    return { pass: false, score: 0, reason: "No ranges specified in config" };
  }

  const { value, error } = extractJson(output);
  if (error) {
    return { pass: false, score: 0, reason: error };
  }

  const record = value as Record<string, unknown>;
  const failures: string[] = [];

  for (const field of fields) {
    const actual = record[field];
    if (typeof actual !== "number") {
      failures.push(`${field}: not a number (got ${typeof actual})`);
      continue;
    }
    const { min, max } = ranges[field];
    if (min !== undefined && actual < min) {
      failures.push(`${field}: ${actual} < min ${min}`);
    }
    if (max !== undefined && actual > max) {
      failures.push(`${field}: ${actual} > max ${max}`);
    }
  }

  if (failures.length > 0) {
    return {
      pass: false,
      score: (fields.length - failures.length) / fields.length,
      reason: failures.join("; "),
    };
  }

  return { pass: true, score: 1, reason: "All numeric fields within expected ranges" };
}
