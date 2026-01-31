import { query, type Options, type Query } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { logger } from "./logger";

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

export function createRouteQuery(prompt: string, config: RouteAgentConfig = {}): Query {
  const options: Options = {
    model: config.model || "claude-opus-4-5-20251101",
    systemPrompt,
  };

  logger.info({ model: options.model }, "Creating route query");

  return query({ prompt, options });
}
