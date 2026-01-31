/**
 * Checkpoint system for Route Agent.
 *
 * Provides a single tool for presenting route plans to users at key workflow stages.
 * The tool call itself becomes the presentation - visible in Claude Code's permission prompt.
 */

// Main checkpoint tool
export {
  presentRoutePlan,
  presentRoutePlanTool,
} from "./tool";
export type {
  WorkflowStage,
  StagePresentationData,
  UserResponse,
  PresentRoutePlanInput,
  PresentRoutePlanOutput,
} from "./tool";

// Prompt templates (guidance for agent on what to include at each stage)
export {
  getConfirmIntentPrompt,
  getPresentFindingsPrompt,
  getSelectRoutePrompt,
  getRefineRoutePrompt,
  getPresentFinalPrompt,
} from "./prompts";

// Shared types
export type {
  CheckpointName,
  ParsedQuery,
  SkillsNeeded,
  SkillResult,
  RouteCandidate,
  RefinedRoute,
} from "./types";
