/**
 * Checkpoint Manager implementation.
 *
 * Manages the interaction flow through structured pauses where the agent
 * presents information and requests user decisions using AskUserQuestion.
 */

import type {
  CheckpointName,
  CheckpointData,
  CheckpointResponse,
  ConfirmIntentData,
  PresentFindingsData,
  SelectRouteData,
  RefineRouteData,
  PresentFinalData,
} from "./types.ts";

/**
 * AskUserQuestion function type - will be provided by Claude Agent SDK.
 * For now, we define the interface to match the expected signature.
 */
export type AskUserQuestionFn = (message: string) => Promise<string>;

/**
 * CheckpointManager orchestrates user interaction checkpoints.
 */
export class CheckpointManager {
  constructor(private askUserQuestion: AskUserQuestionFn) {}

  /**
   * Execute a checkpoint - present information and get user response.
   */
  async checkpoint(
    name: CheckpointName,
    data: CheckpointData
  ): Promise<CheckpointResponse> {
    const message = this.formatMessage(name, data);
    const userResponse = await this.askUserQuestion(message);
    return this.parseResponse(name, userResponse);
  }

  /**
   * Confirm Intent checkpoint - verify parsed query and skill selection.
   */
  async confirmIntent(data: ConfirmIntentData): Promise<CheckpointResponse> {
    return this.checkpoint("confirmIntent", data);
  }

  /**
   * Present Findings checkpoint - show skill results.
   */
  async presentFindings(data: PresentFindingsData): Promise<CheckpointResponse> {
    return this.checkpoint("presentFindings", data);
  }

  /**
   * Select Route checkpoint - choose from route candidates.
   */
  async selectRoute(data: SelectRouteData): Promise<CheckpointResponse> {
    return this.checkpoint("selectRoute", data);
  }

  /**
   * Refine Route checkpoint - fine-tune details.
   */
  async refineRoute(data: RefineRouteData): Promise<CheckpointResponse> {
    return this.checkpoint("refineRoute", data);
  }

  /**
   * Present Final checkpoint - review before generation.
   */
  async presentFinal(data: PresentFinalData): Promise<CheckpointResponse> {
    return this.checkpoint("presentFinal", data);
  }

  /**
   * Format checkpoint data into a user-facing message.
   */
  private formatMessage(name: CheckpointName, data: CheckpointData): string {
    switch (name) {
      case "confirmIntent":
        return this.formatConfirmIntent(data as ConfirmIntentData);
      case "presentFindings":
        return this.formatPresentFindings(data as PresentFindingsData);
      case "selectRoute":
        return this.formatSelectRoute(data as SelectRouteData);
      case "refineRoute":
        return this.formatRefineRoute(data as RefineRouteData);
      case "presentFinal":
        return this.formatPresentFinal(data as PresentFinalData);
    }
  }

  /**
   * Parse user response into structured checkpoint response.
   */
  private parseResponse(
    name: CheckpointName,
    response: string
  ): CheckpointResponse {
    const lowerResponse = response.toLowerCase().trim();

    switch (name) {
      case "confirmIntent":
        if (
          lowerResponse.includes("yes") ||
          lowerResponse.includes("confirm") ||
          lowerResponse.includes("correct") ||
          lowerResponse.includes("proceed")
        ) {
          return { action: "confirm" };
        }
        return { action: "clarify", details: { response } };

      case "presentFindings":
        if (
          lowerResponse.includes("more") ||
          lowerResponse.includes("additional")
        ) {
          return { action: "requestMore", details: { response } };
        }
        return { action: "confirm" };

      case "selectRoute":
        // Look for route selection (number or name)
        const routeMatch = response.match(/route\s+(\d+|[a-z]+)/i);
        if (routeMatch) {
          return { action: "select", details: { routeId: routeMatch[1] } };
        }
        // Look for just a number
        const numberMatch = response.match(/^\d+$/);
        if (numberMatch) {
          return { action: "select", details: { routeId: numberMatch[0] } };
        }
        return { action: "clarify", details: { response } };

      case "refineRoute":
        if (
          lowerResponse.includes("looks good") ||
          lowerResponse.includes("approve") ||
          lowerResponse.includes("yes")
        ) {
          return { action: "confirm" };
        }
        if (
          lowerResponse.includes("change") ||
          lowerResponse.includes("adjust") ||
          lowerResponse.includes("modify")
        ) {
          return { action: "refine", details: { response } };
        }
        return { action: "refine", details: { response } };

      case "presentFinal":
        if (
          lowerResponse.includes("approve") ||
          lowerResponse.includes("yes") ||
          lowerResponse.includes("generate") ||
          lowerResponse.includes("looks good")
        ) {
          return { action: "approve" };
        }
        if (
          lowerResponse.includes("change") ||
          lowerResponse.includes("adjust") ||
          lowerResponse.includes("modify")
        ) {
          return { action: "refine", details: { response } };
        }
        return { action: "clarify", details: { response } };
    }
  }

  // Message formatting methods

  private formatConfirmIntent(data: ConfirmIntentData): string {
    const { query, skillsNeeded } = data;

    let message = "I understand you want to plan a route with:\n\n";

    if (query.destinations.length > 0) {
      message += `**Destinations:** ${query.destinations.join(", ")}\n`;
    }

    if (query.distance) {
      const { min, max } = query.distance;
      if (min && max) {
        message += `**Distance:** ${min}-${max} miles\n`;
      } else if (min) {
        message += `**Distance:** At least ${min} miles\n`;
      } else if (max) {
        message += `**Distance:** Up to ${max} miles\n`;
      }
    }

    if (query.constraints) {
      const { mustVisit, avoid, surfacePreferences } = query.constraints;
      if (mustVisit?.length) {
        message += `**Must visit:** ${mustVisit.join(", ")}\n`;
      }
      if (avoid?.length) {
        message += `**Avoid:** ${avoid.join(", ")}\n`;
      }
      if (surfacePreferences?.length) {
        message += `**Surface:** ${surfacePreferences.join(", ")}\n`;
      }
    }

    if (query.reference) {
      message += `**Reference activity:** ${query.reference}\n`;
    }

    const activeSkills = Object.entries(skillsNeeded)
      .filter(([, active]) => active)
      .map(([skill]) => skill);

    if (activeSkills.length > 0) {
      message += `\n**Research areas:** ${activeSkills.join(", ")}\n`;
    }

    message += "\nIs this correct? (yes/no, or provide clarifications)";

    return message;
  }

  private formatPresentFindings(data: PresentFindingsData): string {
    const { skillResults, insights } = data;

    let message = "Here's what I found:\n\n";

    for (const result of skillResults) {
      message += `**${result.skillName}**\n${result.summary}\n\n`;
    }

    if (insights?.length) {
      message += "**Key insights:**\n";
      for (const insight of insights) {
        message += `- ${insight}\n`;
      }
      message += "\n";
    }

    message +=
      "Would you like to proceed with route options, or should I research more?";

    return message;
  }

  private formatSelectRoute(data: SelectRouteData): string {
    const { candidates } = data;

    let message = "I've prepared these route options:\n\n";

    for (let i = 0; i < candidates.length; i++) {
      const route = candidates[i];
      message += `**Route ${i + 1}: ${route.name}**\n`;
      message += `- Distance: ${route.distance} miles\n`;
      message += `- Elevation: ${route.elevation} ft\n`;
      message += `- Highlights: ${route.highlights.join(", ")}\n`;

      if (route.stops?.length) {
        message += `- Stops: ${route.stops.map((s) => s.name).join(", ")}\n`;
      }

      if (route.warnings?.length) {
        message += `- Warnings: ${route.warnings.join(", ")}\n`;
      }

      message += "\n";
    }

    message += "Which route would you like? (enter number or name)";

    return message;
  }

  private formatRefineRoute(data: RefineRouteData): string {
    const { selected, refinements } = data;

    let message = `Refining **${selected.name}**\n\n`;

    if (refinements?.length) {
      message += "Proposed adjustments:\n";
      for (const refinement of refinements) {
        message += `- ${refinement}\n`;
      }
      message += "\n";
    }

    message += "Any changes needed, or does this look good?";

    return message;
  }

  private formatPresentFinal(data: PresentFinalData): string {
    const { route } = data;

    let message = `**Final Route: ${route.name}**\n\n`;
    message += `- Distance: ${route.distance} miles\n`;
    message += `- Elevation: ${route.elevation} ft\n`;

    if (route.highlights.length > 0) {
      message += `- Highlights: ${route.highlights.join(", ")}\n`;
    }

    if (route.stops?.length) {
      message += "\n**Stops:**\n";
      for (const stop of route.stops) {
        message += `- ${stop.name} (${stop.type})\n`;
      }
    }

    if (route.nutritionPlan) {
      message += "\n**Nutrition Plan:**\n";
      message += `- Total calories: ${route.nutritionPlan.calories}\n`;
      for (const stop of route.nutritionPlan.stops) {
        message += `- ${stop.time}: ${stop.intake}\n`;
      }
    }

    if (route.clothingRecommendations?.length) {
      message += "\n**Clothing:**\n";
      for (const rec of route.clothingRecommendations) {
        message += `- ${rec}\n`;
      }
    }

    if (route.warnings?.length) {
      message += "\n**Warnings:**\n";
      for (const warning of route.warnings) {
        message += `- ${warning}\n`;
      }
    }

    if (route.adjustments.length > 0) {
      message += "\n**Adjustments made:**\n";
      for (const adj of route.adjustments) {
        message += `- ${adj}\n`;
      }
    }

    message += "\nApprove and generate GPX? (yes to generate, or request changes)";

    return message;
  }
}

/**
 * Create a checkpoint manager instance.
 */
export function createCheckpointManager(
  askUserQuestion: AskUserQuestionFn
): CheckpointManager {
  return new CheckpointManager(askUserQuestion);
}
