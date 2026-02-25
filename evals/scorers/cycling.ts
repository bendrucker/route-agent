import type { GradingResult } from "./types";

/**
 * Assert that food stops are spaced at reasonable intervals for cycling.
 *
 * Extracts mile/km markers from the output and checks that the gaps between
 * consecutive stops don't exceed `maxGapMi` (default 30 miles). On long rides,
 * gaps over 30 miles without food risk bonking.
 *
 * Usage in promptfooconfig.yaml:
 * ```yaml
 * assert:
 *   - type: javascript
 *     value: file://../../evals/scorers/cycling.ts:foodStopSpacing
 *     config:
 *       maxGapMi: 30
 *       totalDistanceMi: 90
 * ```
 */
export function foodStopSpacing(
  output: unknown,
  context: { config?: { maxGapMi?: number; totalDistanceMi?: number } },
): GradingResult {
  const maxGapMi = context.config?.maxGapMi ?? 30;
  const totalMi = context.config?.totalDistanceMi;

  if (!totalMi) {
    return { pass: false, score: 0, reason: "Config must specify totalDistanceMi" };
  }

  const text = String(output);

  const miPattern = /(?:mile|mi)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:mile|mi)/gi;
  const markers: number[] = [];
  for (const match of text.matchAll(miPattern)) {
    markers.push(Number.parseFloat(match[1] ?? match[2]));
  }

  if (markers.length === 0) {
    const hasFoodMention = /\b(?:food|cafe|restaurant|stop|eat|lunch|snack|bakery)\b/i.test(text);
    if (totalMi <= maxGapMi) {
      return {
        pass: true,
        score: 1,
        reason: `Route is ${totalMi} mi — no food stops needed within ${maxGapMi} mi threshold`,
      };
    }
    return {
      pass: hasFoodMention,
      score: hasFoodMention ? 0.5 : 0,
      reason: hasFoodMention
        ? "Food stops mentioned but no mile markers found to verify spacing"
        : `No food stops found for a ${totalMi} mi route`,
    };
  }

  markers.sort((a, b) => a - b);
  const points = [0, ...markers, totalMi];
  const gaps: number[] = [];
  for (let i = 1; i < points.length; i++) {
    gaps.push(points[i] - points[i - 1]);
  }

  const maxActualGap = Math.max(...gaps);
  if (maxActualGap <= maxGapMi) {
    return {
      pass: true,
      score: 1,
      reason: `Max gap between stops is ${Math.round(maxActualGap)} mi (limit: ${maxGapMi} mi)`,
    };
  }

  return {
    pass: false,
    score: Math.max(0, 1 - (maxActualGap - maxGapMi) / maxGapMi),
    reason: `Max gap between stops is ${Math.round(maxActualGap)} mi, exceeds ${maxGapMi} mi limit`,
  };
}

/**
 * Assert that clothing recommendations are appropriate for temperature conditions.
 *
 * Checks that the output mentions gear appropriate for the given temperature range.
 * For example, arm warmers should be mentioned when temps are 50-65F, and a
 * vest/jacket when there's a large temperature swing.
 *
 * Usage in promptfooconfig.yaml:
 * ```yaml
 * assert:
 *   - type: javascript
 *     value: file://../../evals/scorers/cycling.ts:clothingForConditions
 *     config:
 *       lowTempF: 45
 *       highTempF: 72
 * ```
 */
export function clothingForConditions(
  output: unknown,
  context: { config?: { lowTempF?: number; highTempF?: number } },
): GradingResult {
  const { lowTempF, highTempF } = context.config ?? {};
  if (lowTempF === undefined || highTempF === undefined) {
    return { pass: false, score: 0, reason: "Config must specify lowTempF and highTempF" };
  }

  const text = String(output).toLowerCase();
  const checks: { condition: string; pass: boolean }[] = [];

  if (lowTempF < 50) {
    const hasColdGear =
      /\b(?:jacket|thermal|long.?sleeve|winter|warm|insulated|shoe.?cover|toe.?cover|heavy|fleece)\b/.test(
        text,
      );
    checks.push({ condition: `Cold gear for ${lowTempF}F`, pass: hasColdGear });
  }

  if (lowTempF >= 50 && lowTempF < 65) {
    const hasLightWarmth =
      /\b(?:arm.?warmer|knee.?warmer|leg.?warmer|vest|gilet|light.?layer|base.?layer)\b/.test(text);
    checks.push({ condition: `Light warmth layers for ${lowTempF}F`, pass: hasLightWarmth });
  }

  const swing = highTempF - lowTempF;
  if (swing > 15) {
    const hasLayering = /\b(?:layer|remov|shed|pocket|storage|bag|transition|peel|strip)\b/.test(
      text,
    );
    checks.push({ condition: `Layering strategy for ${swing}F swing`, pass: hasLayering });
  }

  if (swing > 20) {
    const hasStorage = /\b(?:pocket|bag|saddle.?bag|storage|stash|pack)\b/.test(text);
    checks.push({ condition: `Storage for removed layers (${swing}F swing)`, pass: hasStorage });
  }

  if (checks.length === 0) {
    return {
      pass: true,
      score: 1,
      reason: `Conditions (${lowTempF}-${highTempF}F) don't trigger specific gear checks`,
    };
  }

  const passed = checks.filter((c) => c.pass);
  const failed = checks.filter((c) => !c.pass);
  const score = passed.length / checks.length;

  if (failed.length === 0) {
    return { pass: true, score: 1, reason: "All clothing checks passed" };
  }

  return {
    pass: false,
    score,
    reason: `Failed: ${failed.map((c) => c.condition).join("; ")}`,
  };
}

/**
 * Assert that the output demonstrates awareness of climb sequencing concerns.
 *
 * For routes with significant climbing, the response should address effort
 * management, sequencing rationale, or recovery between climbs.
 *
 * Usage in promptfooconfig.yaml:
 * ```yaml
 * assert:
 *   - type: javascript
 *     value: file://../../evals/scorers/cycling.ts:climbAwareness
 *     config:
 *       elevationGainFt: 4000
 *       climbCount: 2
 * ```
 */
export function climbAwareness(
  output: unknown,
  context: { config?: { elevationGainFt?: number; climbCount?: number } },
): GradingResult {
  const { elevationGainFt = 0, climbCount = 1 } = context.config ?? {};

  if (elevationGainFt < 2000 && climbCount < 2) {
    return { pass: true, score: 1, reason: "Minimal climbing — no sequencing concerns" };
  }

  const text = String(output).toLowerCase();
  const checks: { condition: string; pass: boolean }[] = [];

  const mentionsClimbing =
    /\b(?:climb|ascent|elevation|gradient|grade|steep|hill|summit|peak|col)\b/.test(text);
  checks.push({ condition: "Mentions climbing", pass: mentionsClimbing });

  if (elevationGainFt >= 3000) {
    const mentionsEffort =
      /\b(?:effort|energy|pace|conserve|manage|fatigue|fresh|legs|recover|stamina)\b/.test(text);
    checks.push({
      condition: `Effort management for ${elevationGainFt}ft gain`,
      pass: mentionsEffort,
    });
  }

  if (climbCount >= 2) {
    const mentionsSequencing =
      /\b(?:first|second|order|sequence|before|after|then|save|harder|easier|warm.?up)\b/.test(
        text,
      );
    checks.push({
      condition: `Sequencing for ${climbCount} climbs`,
      pass: mentionsSequencing,
    });
  }

  const passed = checks.filter((c) => c.pass);
  const failed = checks.filter((c) => !c.pass);
  const score = passed.length / checks.length;

  if (failed.length === 0) {
    return { pass: true, score: 1, reason: "All climb awareness checks passed" };
  }

  return {
    pass: false,
    score,
    reason: `Failed: ${failed.map((c) => c.condition).join("; ")}`,
  };
}
