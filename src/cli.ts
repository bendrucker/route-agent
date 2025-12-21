#!/usr/bin/env node

import { createInterface } from "readline";
import { createRouteAgent } from "./index.js";
import { logger } from "./logger.js";

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required");
    process.exit(1);
  }

  console.log("Route Agent - Cycling Route Planning Assistant");
  console.log("============================================");
  console.log("Type your route planning requests or 'exit' to quit.\n");

  const agent = createRouteAgent({ apiKey });

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    if (input.toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close();
      return;
    }

    try {
      const response = await agent.prompt(input);
      console.log("\n" + response + "\n");
    } catch (error) {
      logger.error({ error }, "Failed to process request");
      console.error("\nError:", error instanceof Error ? error.message : String(error));
      console.log();
    }

    rl.prompt();
  });

  rl.on("close", () => {
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error({ error }, "Fatal error");
  console.error("Fatal error:", error);
  process.exit(1);
});
