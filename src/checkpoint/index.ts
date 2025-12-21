/**
 * Checkpoint system for Route Agent.
 *
 * Provides tools and prompts for structured user interaction throughout
 * the route planning workflow. The agent uses RoutePlan to manage state
 * and prompt templates to guide interactions.
 */

// State management
export { RoutePlan, createRoutePlan } from "./route-plan.ts";
export type { RoutePlanState, WorkflowStage } from "./route-plan.ts";

// Prompt templates
export {
  getConfirmIntentPrompt,
  getPresentFindingsPrompt,
  getSelectRoutePrompt,
  getRefineRoutePrompt,
  getPresentFinalPrompt,
  getPromptForStage,
  ORCHESTRATOR_SYSTEM_PROMPT,
} from "./prompts.ts";

// Types
export type {
  CheckpointName,
  CheckpointData,
  CheckpointResponse,
  CheckpointConfig,
  ParsedQuery,
  SkillsNeeded,
  ConfirmIntentData,
  PresentFindingsData,
  SelectRouteData,
  RefineRouteData,
  PresentFinalData,
  SkillResult,
  RouteCandidate,
  RefinedRoute,
} from "./types.ts";

// Legacy exports (deprecated - will be removed)
export { CheckpointManager, createCheckpointManager } from "./manager.ts";
export type { AskUserQuestionFn } from "./manager.ts";
