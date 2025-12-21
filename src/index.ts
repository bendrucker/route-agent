import { Agent } from "@anthropic-ai/claude-agent-sdk";
import { logger } from "./logger.js";

export interface RouteQuery {
  destination?: string;
  distance?: { min?: number; max?: number };
  constraints?: string[];
  reference?: string;
}

export interface RouteAgentConfig {
  apiKey: string;
  model?: string;
}

export function createRouteAgent(config: RouteAgentConfig): Agent {
  const agent = new Agent({
    apiKey: config.apiKey,
    model: config.model || "claude-sonnet-4-5-20251101",
    systemPrompt: `You are a cycling route planning expert assistant.

Your role is to help plan high-quality cycling routes by:
- Understanding user requirements (destination, distance, preferences)
- Researching route options using available data sources
- Providing recommendations with supporting details
- Maintaining an interactive, collaborative planning process

You are not autonomous - always confirm your understanding and get user approval before proceeding with major steps.

Use the checkpoint pattern to pause for user input at key decision points:
1. Confirm Intent: Verify you understood the request correctly
2. Present Findings: Show research results and options
3. Select Route: Let user choose from candidates
4. Refine Route: Make adjustments based on feedback
5. Present Final: Review before generating output

Focus on quality over speed. Take time to do thorough research.`,
    hooks: {
      onTurnStart: (turn) => {
        logger.info({ turn: turn.turnNumber }, "Starting turn");
      },
      onTurnEnd: (turn) => {
        logger.info({ turn: turn.turnNumber }, "Turn complete");
      },
      onError: (error) => {
        logger.error({ error }, "Agent error");
      },
    },
  });

  logger.info({ model: config.model || "claude-sonnet-4-5-20251101" }, "Route agent created");

  return agent;
}

export async function planRoute(agent: Agent, query: string): Promise<string> {
  logger.info({ query }, "Planning route");

  const response = await agent.prompt(query);

  logger.info("Route planning complete");

  return response;
}
