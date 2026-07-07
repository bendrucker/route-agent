import type { CyclingProfile, RouteRequest } from "./types";

const KM_TO_M = 1000;
const MI_TO_M = 1609.34;
const DEFAULT_DISTANCE_TOLERANCE = 0.15;

const distancePattern = /(\d+(?:\.\d+)?)\s*(km|kilometers?|kilometres?|mi|miles?)\b/i;
const elevationPattern =
  /(\d+(?:\.\d+)?)\s*(m|meters?|metres?|ft|feet)\s*(?:of\s+)?(?:climbing|elevation|gain|vert)/i;
const startLocationPattern =
  /\b(?:from|around|starting at|starting from)\s+([A-Z][\w\s]*?)(?=$|,|\bwith\b|\bthat\b|\bfor\b)/i;

function parseDistance(query: string): RouteRequest["distance"] {
  const match = query.match(distancePattern);
  if (!match) {
    throw new Error(`Could not find a distance in query: "${query}"`);
  }
  const value = Number.parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  const meters = unit.startsWith("mi") ? value * MI_TO_M : value * KM_TO_M;
  return { target: Math.round(meters), tolerance: DEFAULT_DISTANCE_TOLERANCE };
}

function parseElevation(query: string): RouteRequest["elevation"] | undefined {
  const match = query.match(elevationPattern);
  if (!match) return undefined;
  const value = Number.parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  const meters = unit.startsWith("ft") || unit.startsWith("feet") ? value * 0.3048 : value;
  return { target: Math.round(meters) };
}

function parseStartLocation(query: string): string {
  const match = query.match(startLocationPattern);
  return match ? match[1].trim() : "";
}

function parseProfile(query: string): CyclingProfile | undefined {
  if (/gravel|mountain|mtb|dirt/i.test(query)) return "mountain";
  if (/rac(e|ing)|tempo/i.test(query)) return "racing";
  return undefined;
}

function parsePreferences(query: string): RouteRequest["preferences"] {
  const profile = parseProfile(query);
  const loop = !/one[- ]way|point[- ]to[- ]point/i.test(query);
  const preferFamiliarRoads = /favorite|familiar|roads? i know|know well/i.test(query);

  const preferences: RouteRequest["preferences"] = { loop };
  if (profile) preferences.profile = profile;
  if (preferFamiliarRoads) preferences.preferFamiliarRoads = true;
  return preferences;
}

/**
 * Extracts distance, elevation, start location, and preferences from a free-text
 * route request. The start location is a place name; resolving it to coordinates
 * (via a geocoding tool) happens outside this pure parsing step.
 */
export function parseRouteRequest(query: string): RouteRequest {
  return {
    startLocation: parseStartLocation(query),
    distance: parseDistance(query),
    elevation: parseElevation(query),
    preferences: parsePreferences(query),
  };
}
