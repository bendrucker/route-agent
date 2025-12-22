/**
 * Prompt templates for route planning checkpoints.
 *
 * These templates guide the agent on what to include when presenting
 * route plans to users at each workflow stage.
 */

import type {
  ParsedQuery,
  SkillsNeeded,
  SkillResult,
  RouteCandidate,
  RefinedRoute,
} from "./types.ts";

/**
 * Get prompt guidance for the Confirm Intent stage.
 *
 * Tells the agent what to include when presenting the parsed query.
 */
export function getConfirmIntentPrompt(
  query: ParsedQuery,
  skillsNeeded: SkillsNeeded
): string {
  return `
Present the following route planning details to the user for confirmation:

**What you understood:**
${query.destinations.length > 0 ? `- Destinations: ${query.destinations.join(", ")}` : ""}
${query.distance ? formatDistance(query.distance) : ""}
${query.constraints ? formatConstraints(query.constraints) : ""}
${query.reference ? `- Reference activity: ${query.reference}` : ""}

**Research areas I'll investigate:**
${formatSkills(skillsNeeded)}

Use the present_route_plan tool with stage "confirm_intent" to show this to the user.
Ask: "Does this match what you're looking for?"
`.trim();
}

/**
 * Get prompt guidance for the Present Findings stage.
 */
export function getPresentFindingsPrompt(
  skillResults: SkillResult[],
  insights?: string[]
): string {
  return `
Present your research findings to the user:

**Research completed:**
${skillResults.map((r) => `- ${r.skillName}: ${r.summary}`).join("\n")}

${insights && insights.length > 0 ? `\n**Key insights:**\n${insights.map((i) => `- ${i}`).join("\n")}` : ""}

Use the present_route_plan tool with stage "present_findings" to show this to the user.
Ask: "Would you like me to generate route options based on these findings?"
`.trim();
}

/**
 * Get prompt guidance for the Select Route stage.
 */
export function getSelectRoutePrompt(candidates: RouteCandidate[]): string {
  return `
Present the following route options to the user:

${candidates.map((route, i) => formatRouteCandidate(route, i + 1)).join("\n\n")}

Use the present_route_plan tool with stage "select_route" to show these options.
Ask: "Which route would you like to select?"
`.trim();
}

/**
 * Get prompt guidance for the Refine Route stage.
 */
export function getRefineRoutePrompt(
  selected: RouteCandidate,
  refinements?: string[]
): string {
  return `
Present refinements for the selected route:

**Route:** ${selected.name}
${refinements && refinements.length > 0 ? `\n**Proposed adjustments:**\n${refinements.map((r) => `- ${r}`).join("\n")}` : ""}

Use the present_route_plan tool with stage "refine_route" to show these details.
Ask: "Do these refinements look good?"
`.trim();
}

/**
 * Get prompt guidance for the Present Final stage.
 */
export function getPresentFinalPrompt(route: RefinedRoute): string {
  return `
Present the complete final route:

${formatFinalRoute(route)}

Use the present_route_plan tool with stage "present_final" to show the complete route.
Ask: "Ready to generate the GPX file?"
`.trim();
}

// Helper functions for formatting

function formatDistance(distance: { min?: number; max?: number }): string {
  if (distance.min && distance.max) {
    return `- Distance: ${distance.min}-${distance.max} miles`;
  } else if (distance.min) {
    return `- Distance: At least ${distance.min} miles`;
  } else if (distance.max) {
    return `- Distance: Up to ${distance.max} miles`;
  }
  return "";
}

function formatConstraints(constraints: {
  mustVisit?: string[];
  avoid?: string[];
  surfacePreferences?: string[];
}): string {
  const parts: string[] = [];
  if (constraints.mustVisit?.length) {
    parts.push(`- Must visit: ${constraints.mustVisit.join(", ")}`);
  }
  if (constraints.avoid?.length) {
    parts.push(`- Avoid: ${constraints.avoid.join(", ")}`);
  }
  if (constraints.surfacePreferences?.length) {
    parts.push(`- Surface: ${constraints.surfacePreferences.join(", ")}`);
  }
  return parts.join("\n");
}

function formatSkills(skills: SkillsNeeded): string {
  return Object.entries(skills)
    .filter(([, active]) => active)
    .map(([skill]) => `- ${skill}`)
    .join("\n");
}

function formatRouteCandidate(route: RouteCandidate, number: number): string {
  const parts: string[] = [];
  parts.push(`**Route ${number}: ${route.name}**`);
  parts.push(`- Distance: ${route.distance} miles`);
  parts.push(`- Elevation: ${route.elevation} ft`);
  parts.push(`- Highlights: ${route.highlights.join(", ")}`);

  if (route.stops?.length) {
    parts.push(`- Stops: ${route.stops.map((s) => s.name).join(", ")}`);
  }

  if (route.warnings?.length) {
    parts.push(`- Warnings: ${route.warnings.join("; ")}`);
  }

  return parts.join("\n");
}

function formatFinalRoute(route: RefinedRoute): string {
  const parts: string[] = [];
  parts.push(`**${route.name}**`);
  parts.push(`- Distance: ${route.distance} miles`);
  parts.push(`- Elevation: ${route.elevation} ft`);
  parts.push(`- Highlights: ${route.highlights.join(", ")}`);

  if (route.stops?.length) {
    parts.push("\n**Stops:**");
    for (const stop of route.stops) {
      parts.push(`- ${stop.name} (${stop.type})`);
    }
  }

  if (route.nutritionPlan) {
    parts.push("\n**Nutrition:**");
    parts.push(`- Total calories: ${route.nutritionPlan.calories}`);
    for (const stop of route.nutritionPlan.stops) {
      parts.push(`- ${stop.time}: ${stop.intake}`);
    }
  }

  if (route.clothingRecommendations?.length) {
    parts.push("\n**Clothing:**");
    for (const rec of route.clothingRecommendations) {
      parts.push(`- ${rec}`);
    }
  }

  if (route.warnings?.length) {
    parts.push("\n**Warnings:**");
    for (const warning of route.warnings) {
      parts.push(`- ${warning}`);
    }
  }

  if (route.adjustments.length > 0) {
    parts.push("\n**Adjustments made:**");
    for (const adj of route.adjustments) {
      parts.push(`- ${adj}`);
    }
  }

  return parts.join("\n");
}
