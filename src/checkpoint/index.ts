/**
 * Checkpoint system for Route Agent.
 *
 * Provides a single tool for presenting route plans to users at key workflow stages.
 * The tool call itself becomes the presentation - visible in Claude Code's permission prompt.
 */

// Prompt templates (guidance for agent on what to include at each stage)
export {
  getConfirmIntentPrompt,
  getPresentFinalPrompt,
  getPresentFindingsPrompt,
  getRefineRoutePrompt,
  getSelectRoutePrompt,
} from "./prompts";
export type {
  PresentRoutePlanInput,
  PresentRoutePlanOutput,
  StagePresentationData,
  UserResponse,
  WorkflowStage,
} from "./tool";
// Main checkpoint tool
export {
  presentRoutePlan,
  presentRoutePlanTool,
} from "./tool";

// Shared types
export type {
  CheckpointName,
  ParsedQuery,
  RefinedRoute,
  RouteCandidate,
  SkillResult,
  SkillsNeeded,
} from "./types";
