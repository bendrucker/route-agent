import type { McpStdioServerConfig } from "@anthropic-ai/claude-agent-sdk";

export function createStravaServer(): McpStdioServerConfig {
  return {
    command: "bunx",
    args: ["strava-mcp-server"],
  };
}
