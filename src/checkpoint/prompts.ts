/**
 * Checkpoint prompt templates for the Route Agent.
 *
 * These prompts guide the agent through the route planning workflow.
 * Rather than hard-coded methods, the agent uses these templates to
 * understand what to do at each stage and how to interact with users.
 */

import type {
  ParsedQuery,
  SkillsNeeded,
  SkillResult,
  RouteCandidate,
  RefinedRoute,
} from "./types.ts";

/**
 * Base template for checkpoint prompts.
 */
interface CheckpointPromptTemplate {
  stage: string;
  systemPrompt: string;
  formatContext: (data: unknown) => string;
  userMessageTemplate: string;
  expectedActions: string[];
}

/**
 * Confirm Intent checkpoint prompt.
 */
export function getConfirmIntentPrompt(
  query: ParsedQuery,
  skillsNeeded: SkillsNeeded
): string {
  const parts: string[] = [
    "Present the following route planning details to the user for confirmation:",
    "",
  ];

  if (query.destinations.length > 0) {
    parts.push(`**Destinations:** ${query.destinations.join(", ")}`);
  }

  if (query.distance) {
    const { min, max } = query.distance;
    if (min && max) {
      parts.push(`**Distance:** ${min}-${max} miles`);
    } else if (min) {
      parts.push(`**Distance:** At least ${min} miles`);
    } else if (max) {
      parts.push(`**Distance:** Up to ${max} miles`);
    }
  }

  if (query.constraints) {
    const { mustVisit, avoid, surfacePreferences } = query.constraints;
    if (mustVisit?.length) {
      parts.push(`**Must visit:** ${mustVisit.join(", ")}`);
    }
    if (avoid?.length) {
      parts.push(`**Avoid:** ${avoid.join(", ")}`);
    }
    if (surfacePreferences?.length) {
      parts.push(`**Surface:** ${surfacePreferences.join(", ")}`);
    }
  }

  if (query.reference) {
    parts.push(`**Reference activity:** ${query.reference}`);
  }

  const activeSkills = Object.entries(skillsNeeded)
    .filter(([, active]) => active)
    .map(([skill]) => skill);

  if (activeSkills.length > 0) {
    parts.push("");
    parts.push(`**Research areas:** ${activeSkills.join(", ")}`);
  }

  parts.push("");
  parts.push(
    "Ask the user to confirm this is correct or provide clarifications."
  );
  parts.push("");
  parts.push("Based on their response:");
  parts.push("- If confirmed: Use RoutePlan.confirmIntent() to proceed");
  parts.push(
    "- If they want changes: Use RoutePlan.setQuery() to update, then ask again"
  );
  parts.push(
    "- If they provide additional details: Use RoutePlan.addUserFeedback() to record"
  );

  return parts.join("\n");
}

/**
 * Present Findings checkpoint prompt.
 */
export function getPresentFindingsPrompt(
  skillResults: SkillResult[],
  insights?: string[]
): string {
  const parts: string[] = [
    "Present your research findings to the user:",
    "",
  ];

  parts.push("**Research Results:**");
  for (const result of skillResults) {
    parts.push(`- **${result.skillName}**: ${result.summary}`);
  }

  if (insights?.length) {
    parts.push("");
    parts.push("**Key Insights:**");
    for (const insight of insights) {
      parts.push(`- ${insight}`);
    }
  }

  parts.push("");
  parts.push(
    "Ask the user if they'd like to proceed with route options or if they want more research."
  );
  parts.push("");
  parts.push("Based on their response:");
  parts.push(
    "- If proceeding: Use RoutePlan.presentFindings() to advance"
  );
  parts.push(
    "- If requesting more: Invoke additional skills, then present again"
  );
  parts.push(
    "- Record their feedback: Use RoutePlan.addUserFeedback()"
  );

  return parts.join("\n");
}

/**
 * Select Route checkpoint prompt.
 */
export function getSelectRoutePrompt(
  candidates: RouteCandidate[]
): string {
  const parts: string[] = [
    "Present the following route options to the user:",
    "",
  ];

  for (let i = 0; i < candidates.length; i++) {
    const route = candidates[i];
    parts.push(`**Route ${i + 1}: ${route.name}** (ID: ${route.id})`);
    parts.push(`- Distance: ${route.distance} miles`);
    parts.push(`- Elevation: ${route.elevation} ft`);
    parts.push(`- Highlights: ${route.highlights.join(", ")}`);

    if (route.stops?.length) {
      parts.push(`- Stops: ${route.stops.map((s) => s.name).join(", ")}`);
    }

    if (route.warnings?.length) {
      parts.push(`- Warnings: ${route.warnings.join("; ")}`);
    }

    parts.push("");
  }

  parts.push("Ask the user which route they'd like to select.");
  parts.push("");
  parts.push("Based on their response:");
  parts.push(
    "- If selecting a route: Use RoutePlan.selectRoute(routeId) with the route's ID"
  );
  parts.push(
    "- If they want modifications: Adjust candidates and present again"
  );
  parts.push(
    "- Record their feedback: Use RoutePlan.addUserFeedback()"
  );

  return parts.join("\n");
}

/**
 * Refine Route checkpoint prompt.
 */
export function getRefineRoutePrompt(
  selected: RouteCandidate,
  refinements?: string[]
): string {
  const parts: string[] = [
    `Refining **${selected.name}**`,
    "",
  ];

  if (refinements?.length) {
    parts.push("**Proposed Adjustments:**");
    for (const refinement of refinements) {
      parts.push(`- ${refinement}`);
    }
    parts.push("");
  }

  parts.push("Present these refinements to the user.");
  parts.push("Ask if they'd like any changes or if this looks good.");
  parts.push("");
  parts.push("Based on their response:");
  parts.push(
    "- If approved: Use RoutePlan.setRefinedRoute() with the refined details"
  );
  parts.push(
    "- If requesting changes: Make adjustments and present again"
  );
  parts.push(
    "- Record their feedback: Use RoutePlan.addUserFeedback()"
  );

  return parts.join("\n");
}

/**
 * Present Final checkpoint prompt.
 */
export function getPresentFinalPrompt(route: RefinedRoute): string {
  const parts: string[] = [
    `**Final Route: ${route.name}**`,
    "",
    `- Distance: ${route.distance} miles`,
    `- Elevation: ${route.elevation} ft`,
  ];

  if (route.highlights.length > 0) {
    parts.push(`- Highlights: ${route.highlights.join(", ")}`);
  }

  if (route.stops?.length) {
    parts.push("");
    parts.push("**Stops:**");
    for (const stop of route.stops) {
      parts.push(`- ${stop.name} (${stop.type})`);
    }
  }

  if (route.nutritionPlan) {
    parts.push("");
    parts.push("**Nutrition Plan:**");
    parts.push(`- Total calories: ${route.nutritionPlan.calories}`);
    for (const stop of route.nutritionPlan.stops) {
      parts.push(`- ${stop.time}: ${stop.intake}`);
    }
  }

  if (route.clothingRecommendations?.length) {
    parts.push("");
    parts.push("**Clothing:**");
    for (const rec of route.clothingRecommendations) {
      parts.push(`- ${rec}`);
    }
  }

  if (route.warnings?.length) {
    parts.push("");
    parts.push("**Warnings:**");
    for (const warning of route.warnings) {
      parts.push(`- ${warning}`);
    }
  }

  if (route.adjustments.length > 0) {
    parts.push("");
    parts.push("**Adjustments Made:**");
    for (const adj of route.adjustments) {
      parts.push(`- ${adj}`);
    }
  }

  parts.push("");
  parts.push("Present this final route to the user.");
  parts.push("Ask if they approve and want to generate the GPX file.");
  parts.push("");
  parts.push("Based on their response:");
  parts.push(
    "- If approved: Use RoutePlan.approveFinal() then proceed to GPX generation"
  );
  parts.push(
    "- If requesting changes: Use RoutePlan.resetToStage() to go back and adjust"
  );
  parts.push(
    "- Record their feedback: Use RoutePlan.addUserFeedback()"
  );

  return parts.join("\n");
}

/**
 * Orchestrator system prompt - guides the agent through the workflow.
 */
export const ORCHESTRATOR_SYSTEM_PROMPT = `
You are a route planning orchestrator agent. Your role is to guide the user through
creating a cycling route by coordinating research skills and managing the workflow.

You have access to a RoutePlan tool that tracks the current state of route planning.
Use RoutePlan.getState() and RoutePlan.getSummary() to understand where you are.

The workflow has these stages:
1. query_received - Parse user intent
2. intent_confirmed - User has confirmed their requirements
3. findings_presented - Research results have been shared
4. route_selected - User has chosen a route option
5. route_refined - Route has been fine-tuned
6. final_approved - User approved final route, ready for GPX

At each stage, you'll receive a prompt template that tells you:
- What information to present to the user
- How to ask for their input
- Which RoutePlan methods to call based on their response

Key principles:
- Always check RoutePlan.getState() to know where you are
- Use RoutePlan methods to advance the workflow deterministically
- Record user feedback with RoutePlan.addUserFeedback()
- Don't hard-code logic - follow the prompt templates
- Be flexible - users may want to go back or skip ahead

Your goal is to create an excellent route through collaborative research and refinement.
`.trim();

/**
 * Get the appropriate prompt for the current workflow stage.
 */
export function getPromptForStage(
  stage: string,
  data: unknown
): string {
  switch (stage) {
    case "query_received": {
      const { query, skillsNeeded } = data as {
        query: ParsedQuery;
        skillsNeeded: SkillsNeeded;
      };
      return getConfirmIntentPrompt(query, skillsNeeded);
    }

    case "intent_confirmed": {
      const { skillResults, insights } = data as {
        skillResults: SkillResult[];
        insights?: string[];
      };
      return getPresentFindingsPrompt(skillResults, insights);
    }

    case "findings_presented": {
      const { candidates } = data as { candidates: RouteCandidate[] };
      return getSelectRoutePrompt(candidates);
    }

    case "route_selected": {
      const { selected, refinements } = data as {
        selected: RouteCandidate;
        refinements?: string[];
      };
      return getRefineRoutePrompt(selected, refinements);
    }

    case "route_refined": {
      const { route } = data as { route: RefinedRoute };
      return getPresentFinalPrompt(route);
    }

    default:
      throw new Error(`Unknown stage: ${stage}`);
  }
}
