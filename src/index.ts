import { Agent } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { logger } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const systemPrompt = readFileSync(join(__dirname, "system-prompt.md"), "utf-8");

export interface RouteQuery {
  destination?: string;
  distance?: { min?: number; max?: number };
  constraints?: string[];
  reference?: string;
}

export interface RouteAgentConfig {
  model?: string;
}

export function createRouteAgent(config: RouteAgentConfig = {}): Agent {
  const agent = new Agent({
    model: config.model || "claude-opus-4-5-20251101",
    systemPrompt,
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

  logger.info({ model: config.model || "claude-opus-4-5-20251101" }, "Route agent created");

  return agent;
}

export async function planRoute(agent: Agent, query: string): Promise<string> {
  logger.info({ query }, "Planning route");

  const response = await agent.prompt(query);

  logger.info("Route planning complete");

  return response;
}
