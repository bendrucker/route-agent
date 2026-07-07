import type {
  RoutePoint,
  WaterStopPlanningInput,
  WaterStopPlanningOutput,
  WaterStopRecommendation,
} from "./types";

const DEFAULT_CORRIDOR_DISTANCE_M = 500;
const DEFAULT_NORMAL_SPACING_M = 20000;
const DEFAULT_HOT_WEATHER_SPACING_M = 10000;

function haversineM(a: RoutePoint, b: RoutePoint): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function cumulativeDistances(route: RoutePoint[]): number[] {
  const distances = [0];
  for (let i = 1; i < route.length; i++) {
    distances.push(distances[i - 1] + haversineM(route[i - 1], route[i]));
  }
  return distances;
}

interface CorridorCandidate {
  source: WaterStopPlanningInput["waterSources"][number];
  distanceAlongRouteM: number;
  distanceFromRouteM: number;
}

function nearestRoutePoint(
  source: RoutePoint,
  route: RoutePoint[],
  distances: number[],
): { distanceAlongRouteM: number; distanceFromRouteM: number } {
  let nearestIndex = 0;
  let nearestDistanceM = Number.POSITIVE_INFINITY;

  for (let i = 0; i < route.length; i++) {
    const distanceM = haversineM(source, route[i]);
    if (distanceM < nearestDistanceM) {
      nearestDistanceM = distanceM;
      nearestIndex = i;
    }
  }

  return { distanceAlongRouteM: distances[nearestIndex], distanceFromRouteM: nearestDistanceM };
}

function findCorridorCandidates(
  input: WaterStopPlanningInput,
  distances: number[],
): CorridorCandidate[] {
  const corridorDistanceM = input.corridorDistanceM ?? DEFAULT_CORRIDOR_DISTANCE_M;

  return input.waterSources
    .map((source) => ({ source, ...nearestRoutePoint(source, input.route, distances) }))
    .filter((candidate) => candidate.distanceFromRouteM <= corridorDistanceM)
    .sort((a, b) => a.distanceAlongRouteM - b.distanceAlongRouteM);
}

function selectSpacedStops(
  candidates: CorridorCandidate[],
  minSpacingM: number,
): WaterStopRecommendation[] {
  const stops: WaterStopRecommendation[] = [];
  let lastStopDistanceM = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    if (candidate.distanceAlongRouteM - lastStopDistanceM < minSpacingM) continue;
    stops.push(candidate);
    lastStopDistanceM = candidate.distanceAlongRouteM;
  }

  return stops;
}

export function planWaterStops(input: WaterStopPlanningInput): WaterStopPlanningOutput {
  const distances = cumulativeDistances(input.route);
  const candidates = findCorridorCandidates(input, distances);
  const minSpacingM = input.isHotWeather
    ? (input.hotWeatherSpacingM ?? DEFAULT_HOT_WEATHER_SPACING_M)
    : (input.normalSpacingM ?? DEFAULT_NORMAL_SPACING_M);

  return {
    stops: selectSpacedStops(candidates, minSpacingM),
    isHotWeather: input.isHotWeather,
    totalDistanceM: distances[distances.length - 1] ?? 0,
  };
}
