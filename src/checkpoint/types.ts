/**
 * Checkpoint types for the Route Agent.
 *
 * Defines the checkpoint system that manages user interaction flow through
 * structured pauses where the agent presents information and requests decisions.
 */

/**
 * Checkpoint names corresponding to the workflow stages.
 */
export type CheckpointName =
  | "confirmIntent"
  | "presentFindings"
  | "selectRoute"
  | "refineRoute"
  | "presentFinal";

/**
 * Parsed query structure from user input.
 */
export interface ParsedQuery {
  destinations: string[];
  distance?: { min?: number; max?: number };
  constraints?: {
    mustVisit?: string[];
    avoid?: string[];
    surfacePreferences?: string[];
  };
  reference?: string;
}

/**
 * Skills to invoke based on query analysis.
 */
export interface SkillsNeeded {
  history?: boolean;
  climb?: boolean;
  weather?: boolean;
  stops?: boolean;
  route?: boolean;
  safety?: boolean;
  nutrition?: boolean;
  clothing?: boolean;
}

/**
 * Checkpoint data for confirming user intent.
 */
export interface ConfirmIntentData {
  query: ParsedQuery;
  skillsNeeded: SkillsNeeded;
}

/**
 * Skill result structure.
 */
export interface SkillResult {
  skillName: string;
  summary: string;
  data: Record<string, unknown>;
}

/**
 * Checkpoint data for presenting research findings.
 */
export interface PresentFindingsData {
  skillResults: SkillResult[];
  insights?: string[];
}

/**
 * Route candidate structure.
 */
export interface RouteCandidate {
  id: string;
  name: string;
  distance: number;
  elevation: number;
  highlights: string[];
  stops?: Array<{
    type: "cafe" | "water" | "viewpoint";
    name: string;
    location: string;
  }>;
  warnings?: string[];
}

/**
 * Checkpoint data for route selection.
 */
export interface SelectRouteData {
  candidates: RouteCandidate[];
}

/**
 * Refined route with adjustments.
 */
export interface RefinedRoute extends RouteCandidate {
  adjustments: string[];
  nutritionPlan?: {
    calories: number;
    stops: Array<{ time: string; intake: string }>;
  };
  clothingRecommendations?: string[];
}

/**
 * Checkpoint data for refining route.
 */
export interface RefineRouteData {
  selected: RouteCandidate;
  refinements?: string[];
}

/**
 * Checkpoint data for presenting final route.
 */
export interface PresentFinalData {
  route: RefinedRoute;
}

/**
 * Union type of all checkpoint data.
 */
export type CheckpointData =
  | ConfirmIntentData
  | PresentFindingsData
  | SelectRouteData
  | RefineRouteData
  | PresentFinalData;

/**
 * User response to a checkpoint.
 */
export interface CheckpointResponse {
  action: "confirm" | "clarify" | "select" | "refine" | "approve" | "requestMore";
  details?: Record<string, unknown>;
}

/**
 * Checkpoint configuration.
 */
export interface CheckpointConfig {
  name: CheckpointName;
  data: CheckpointData;
  formatMessage: (data: CheckpointData) => string;
  parseResponse: (response: string) => CheckpointResponse;
}
