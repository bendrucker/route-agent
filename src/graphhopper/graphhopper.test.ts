import { describe, expect, test } from "bun:test";
import { createMockGraphHopperServer } from "./mock";
import { createGraphHopperServer } from "./server";

describe("createGraphHopperServer", () => {
  test("returns sdk server config", () => {
    const server = createGraphHopperServer("test-api-key");
    expect(server.type).toBe("sdk");
    expect(server.name).toBe("graphhopper");
    expect(server.instance).toBeDefined();
  });
});

describe("createMockGraphHopperServer", () => {
  test("returns sdk server config", () => {
    const server = createMockGraphHopperServer();
    expect(server.type).toBe("sdk");
    expect(server.name).toBe("graphhopper-mock");
    expect(server.instance).toBeDefined();
  });
});
