/**
 * Checkpoint system for Route Agent.
 *
 * Provides structured user interaction points throughout the route planning workflow.
 */

export { CheckpointManager, createCheckpointManager } from "./manager.ts";
export type { AskUserQuestionFn } from "./manager.ts";
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
