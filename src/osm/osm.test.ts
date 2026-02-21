import { describe, expect, test } from "bun:test";
import { createMockOsmServer } from "./mock";
import { createOsmServer } from "./server";

describe("createOsmServer", () => {
  test("returns sdk server config", () => {
    const server = createOsmServer();
    expect(server.type).toBe("sdk");
    expect(server.name).toBe("osm");
    expect(server.instance).toBeDefined();
  });
});

describe("createMockOsmServer", () => {
  test("returns sdk server config", () => {
    const server = createMockOsmServer();
    expect(server.type).toBe("sdk");
    expect(server.name).toBe("osm-mock");
    expect(server.instance).toBeDefined();
  });
});
