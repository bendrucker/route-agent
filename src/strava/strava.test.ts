import { describe, expect, test } from "bun:test";
import { createMockStravaServer } from "./mock";
import { createStravaServer } from "./server";

describe("createStravaServer", () => {
  test("returns stdio config with bunx command", () => {
    const config = createStravaServer();
    expect(config.command).toBe("bunx");
    expect(config.args).toEqual(["strava-mcp-server"]);
  });
});

describe("createMockStravaServer", () => {
  test("returns sdk server config", () => {
    const server = createMockStravaServer();
    expect(server.type).toBe("sdk");
    expect(server.name).toBe("strava-mock");
    expect(server.instance).toBeDefined();
  });
});
