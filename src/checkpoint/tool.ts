/**
 * Route planning checkpoint tool - a single tool that presents route plans to users.
 *
 * Design:
 * - The tool call itself presents the plan data (visible in permission prompt)
 * - Claude Code's permission flow becomes the confirmation UI
 * - User approves/rejects via permission system
 * - Tool returns user's decision for agent to process
 * - No complex state management - agent manages workflow in context
 */

import type {
  ParsedQuery,
  SkillsNeeded,
  SkillResult,
  RouteCandidate,
  RefinedRoute,
} from "./types";

/**
 * Workflow stages for route planning.
 */
export type WorkflowStage =
  | "confirm_intent"
  | "present_findings"
  | "select_route"
  | "refine_route"
  | "present_final";

/**
 * Data presented at each workflow stage.
 */
export type StagePresentationData =
  | {
      stage: "confirm_intent";
      query: ParsedQuery;
      skillsNeeded: SkillsNeeded;
    }
  | {
      stage: "present_findings";
      skillResults: SkillResult[];
      insights?: string[];
    }
  | {
      stage: "select_route";
      candidates: RouteCandidate[];
    }
  | {
      stage: "refine_route";
      selectedRoute: RouteCandidate;
      proposedRefinements?: string[];
    }
  | {
      stage: "present_final";
      finalRoute: RefinedRoute;
    };

/**
 * User's response to the presentation.
 */
export interface UserResponse {
  approved: boolean;
  feedback?: string;
  selectedRouteId?: string;
}

/**
 * Input to the PresentRoutePlan tool.
 * This data becomes visible when the tool is called.
 */
export interface PresentRoutePlanInput {
  presentation: StagePresentationData;
  prompt: string;
}

/**
 * Output from the PresentRoutePlan tool.
 */
export interface PresentRoutePlanOutput {
  response: UserResponse;
}

/**
 * The single checkpoint tool - presents route plans and captures user decisions.
 *
 * When called in Claude Code:
 * - Tool call shows the presentation data in permission prompt
 * - User sees the route plan details
 * - User approves/rejects via permission system
 * - Tool returns the decision for agent to process
 *
 * In a real application:
 * - This tool can be intercepted to show a proper UI
 * - Same interface works for both testing and production
 */
export async function presentRoutePlan(
  input: PresentRoutePlanInput
): Promise<PresentRoutePlanOutput> {
  // In Claude Code, this is where the permission prompt appears
  // The input data is visible to the user
  // For now, we'll simulate approval (real implementation would ask user)

  // This function will be replaced with actual user interaction
  // For testing, we can inject different responses
  return {
    response: {
      approved: true,
      feedback: "User approved via permission system",
    },
  };
}

/**
 * Tool definition for the Agent SDK.
 */
export const presentRoutePlanTool = {
  name: "present_route_plan",
  description:
    "Present route planning information to the user at a checkpoint. " +
    "The presentation data will be visible to the user, and they can approve or provide feedback. " +
    "Use this at key workflow stages: confirm_intent, present_findings, select_route, refine_route, present_final.",
  inputSchema: {
    type: "object",
    properties: {
      presentation: {
        type: "object",
        description: "The route plan data to present (visible to user)",
        oneOf: [
          {
            type: "object",
            properties: {
              stage: { type: "string", const: "confirm_intent" },
              query: { type: "object" },
              skillsNeeded: { type: "object" },
            },
            required: ["stage", "query", "skillsNeeded"],
          },
          {
            type: "object",
            properties: {
              stage: { type: "string", const: "present_findings" },
              skillResults: { type: "array" },
              insights: { type: "array" },
            },
            required: ["stage", "skillResults"],
          },
          {
            type: "object",
            properties: {
              stage: { type: "string", const: "select_route" },
              candidates: { type: "array" },
            },
            required: ["stage", "candidates"],
          },
          {
            type: "object",
            properties: {
              stage: { type: "string", const: "refine_route" },
              selectedRoute: { type: "object" },
              proposedRefinements: { type: "array" },
            },
            required: ["stage", "selectedRoute"],
          },
          {
            type: "object",
            properties: {
              stage: { type: "string", const: "present_final" },
              finalRoute: { type: "object" },
            },
            required: ["stage", "finalRoute"],
          },
        ],
      },
      prompt: {
        type: "string",
        description:
          "Human-readable message asking for user input (e.g., 'Does this look correct?', 'Which route would you like?')",
      },
    },
    required: ["presentation", "prompt"],
  },
  fn: presentRoutePlan,
};
