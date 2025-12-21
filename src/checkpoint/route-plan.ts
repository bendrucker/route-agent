/**
 * RoutePlan state manager - provides tools for agent to read/update route state.
 *
 * This replaces the rigid CheckpointManager class with a flexible state container
 * that the agent can query and update deterministically.
 */

import type {
  ParsedQuery,
  SkillsNeeded,
  SkillResult,
  RouteCandidate,
  RefinedRoute,
} from "./types.ts";

/**
 * Current stage in the route planning workflow.
 */
export type WorkflowStage =
  | "query_received"
  | "intent_confirmed"
  | "findings_presented"
  | "route_selected"
  | "route_refined"
  | "final_approved";

/**
 * RoutePlan state - the single source of truth for route planning progress.
 */
export interface RoutePlanState {
  stage: WorkflowStage;
  query?: ParsedQuery;
  skillsNeeded?: SkillsNeeded;
  skillResults?: SkillResult[];
  insights?: string[];
  candidates?: RouteCandidate[];
  selectedRoute?: RouteCandidate;
  refinedRoute?: RefinedRoute;
  userFeedback?: Array<{
    stage: WorkflowStage;
    feedback: string;
    timestamp: Date;
  }>;
}

/**
 * RoutePlan - manages route planning state and provides tools for the agent.
 */
export class RoutePlan {
  private state: RoutePlanState;

  constructor(initialState?: Partial<RoutePlanState>) {
    this.state = {
      stage: "query_received",
      userFeedback: [],
      ...initialState,
    };
  }

  /**
   * Get the current route plan state.
   * Agent uses this to understand where it is in the workflow.
   */
  getState(): Readonly<RoutePlanState> {
    return { ...this.state };
  }

  /**
   * Get the current workflow stage.
   */
  getStage(): WorkflowStage {
    return this.state.stage;
  }

  /**
   * Update the parsed query.
   */
  setQuery(query: ParsedQuery): void {
    this.state.query = query;
  }

  /**
   * Update skills needed.
   */
  setSkillsNeeded(skills: SkillsNeeded): void {
    this.state.skillsNeeded = skills;
  }

  /**
   * Confirm intent and advance to next stage.
   */
  confirmIntent(): void {
    if (this.state.stage !== "query_received") {
      throw new Error(
        `Cannot confirm intent from stage: ${this.state.stage}`
      );
    }
    this.state.stage = "intent_confirmed";
  }

  /**
   * Add skill results to the plan.
   */
  addSkillResults(results: SkillResult[]): void {
    this.state.skillResults = [
      ...(this.state.skillResults || []),
      ...results,
    ];
  }

  /**
   * Add insights from skill analysis.
   */
  addInsights(insights: string[]): void {
    this.state.insights = [...(this.state.insights || []), ...insights];
  }

  /**
   * Mark findings as presented.
   */
  presentFindings(): void {
    if (this.state.stage !== "intent_confirmed") {
      throw new Error(
        `Cannot present findings from stage: ${this.state.stage}`
      );
    }
    this.state.stage = "findings_presented";
  }

  /**
   * Set route candidates.
   */
  setCandidates(candidates: RouteCandidate[]): void {
    this.state.candidates = candidates;
  }

  /**
   * Select a route by ID.
   */
  selectRoute(routeId: string): void {
    if (!this.state.candidates) {
      throw new Error("No candidates available to select from");
    }

    const selected = this.state.candidates.find((r) => r.id === routeId);
    if (!selected) {
      throw new Error(`Route not found: ${routeId}`);
    }

    this.state.selectedRoute = selected;
    this.state.stage = "route_selected";
  }

  /**
   * Update the refined route.
   */
  setRefinedRoute(route: RefinedRoute): void {
    this.state.refinedRoute = route;
    this.state.stage = "route_refined";
  }

  /**
   * Approve the final route.
   */
  approveFinal(): void {
    if (this.state.stage !== "route_refined") {
      throw new Error(
        `Cannot approve final from stage: ${this.state.stage}`
      );
    }
    this.state.stage = "final_approved";
  }

  /**
   * Add user feedback at the current stage.
   */
  addUserFeedback(feedback: string): void {
    this.state.userFeedback = this.state.userFeedback || [];
    this.state.userFeedback.push({
      stage: this.state.stage,
      feedback,
      timestamp: new Date(),
    });
  }

  /**
   * Reset to a previous stage (for backtracking).
   */
  resetToStage(stage: WorkflowStage): void {
    this.state.stage = stage;
  }

  /**
   * Get a summary of the current plan for agent context.
   */
  getSummary(): string {
    const parts: string[] = [];

    parts.push(`Current Stage: ${this.state.stage}`);

    if (this.state.query) {
      parts.push(
        `\nQuery: ${this.state.query.destinations.join(", ")}`
      );
      if (this.state.query.distance) {
        const { min, max } = this.state.query.distance;
        parts.push(
          `Distance: ${min ? `${min}-` : ""}${max ? `${max}` : ""} miles`
        );
      }
    }

    if (this.state.skillResults) {
      parts.push(
        `\nSkill Results: ${this.state.skillResults.length} completed`
      );
    }

    if (this.state.candidates) {
      parts.push(`\nCandidates: ${this.state.candidates.length} routes`);
    }

    if (this.state.selectedRoute) {
      parts.push(
        `\nSelected: ${this.state.selectedRoute.name} (${this.state.selectedRoute.distance} mi)`
      );
    }

    if (this.state.refinedRoute) {
      parts.push(
        `\nRefined: ${this.state.refinedRoute.adjustments.length} adjustments made`
      );
    }

    if (this.state.userFeedback && this.state.userFeedback.length > 0) {
      parts.push(
        `\nUser Feedback: ${this.state.userFeedback.length} comments`
      );
    }

    return parts.join("\n");
  }
}

/**
 * Create a new RoutePlan instance.
 */
export function createRoutePlan(
  initialState?: Partial<RoutePlanState>
): RoutePlan {
  return new RoutePlan(initialState);
}
