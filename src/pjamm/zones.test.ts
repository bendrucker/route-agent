import { describe, expect, test } from "bun:test";
import type { BoundingBox } from "./types";
import { COUNTRY_ZONES } from "./zones";

function covers(name: string, lat: number, lng: number): boolean {
  const zone = COUNTRY_ZONES.find((z) => z.name === name);
  if (!zone) throw new Error(`No zone named ${name}`);
  return zone.boxes.some(
    (box: BoundingBox) =>
      lat >= box.south && lat <= box.north && lng >= box.west && lng <= box.east,
  );
}

describe("COUNTRY_ZONES", () => {
  test("has 30 zones with unique ids", () => {
    expect(COUNTRY_ZONES.length).toBe(30);
    expect(new Set(COUNTRY_ZONES.map((z) => z.id)).size).toBe(30);
  });

  test("every box is well-formed and in range", () => {
    for (const zone of COUNTRY_ZONES) {
      expect(zone.boxes.length).toBeGreaterThan(0);
      for (const box of zone.boxes) {
        expect(box.south).toBeLessThan(box.north);
        expect(box.west).toBeLessThan(box.east);
        expect(box.south).toBeGreaterThanOrEqual(-90);
        expect(box.north).toBeLessThanOrEqual(90);
        expect(box.west).toBeGreaterThanOrEqual(-180);
        expect(box.east).toBeLessThanOrEqual(180);
      }
    }
  });

  test("covers known climb locations, including overseas territories", () => {
    expect(covers("France", 45.0605, 6.0377)).toBe(true); // Alpe d'Huez
    expect(covers("United States", 37.896, -122.637)).toBe(true); // Mt. Tamalpais
    expect(covers("United States", 20.916, -156.381)).toBe(true); // Haleakala, Hawaii
    expect(covers("Spain", 27.96, -15.57)).toBe(true); // Pico de las Nieves, Gran Canaria
    expect(covers("France", -21.08, 55.38)).toBe(true); // Cirque de Mafate, Réunion
    expect(covers("Italy", 46.53, 10.45)).toBe(true); // Stelvio
  });

  test("does not blanket the globe", () => {
    expect(covers("United States", 0, -140)).toBe(false); // open Pacific
    expect(covers("France", 48.85, -30)).toBe(false); // mid-Atlantic
  });
});
