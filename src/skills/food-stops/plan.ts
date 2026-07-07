import type {
  FoodPlace,
  FoodStopPlanningInput,
  FoodStopPlanningOutput,
  FoodStopRecommendation,
  MealType,
  OpeningHours,
  RoutePoint,
} from "./types";

const DEFAULT_AVERAGE_SPEED_KMH = 20;
const DEFAULT_CORRIDOR_DISTANCE_M = 500;
const DEFAULT_TARGET_SPACING_M = 40000;
const BACKUP_GAP_MULTIPLIER = 1.5;

const MINUTES_PER_HOUR = 60;
const MEAL_WINDOWS = [
  { startMinute: 6 * MINUTES_PER_HOUR, endMinute: 10 * MINUTES_PER_HOUR }, // breakfast
  { startMinute: 11 * MINUTES_PER_HOUR, endMinute: 14 * MINUTES_PER_HOUR }, // lunch
  { startMinute: 17 * MINUTES_PER_HOUR, endMinute: 20 * MINUTES_PER_HOUR }, // dinner
];

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

function nearestRoutePoint(
  place: RoutePoint,
  route: RoutePoint[],
  distances: number[],
): { distanceAlongRouteM: number; distanceFromRouteM: number } {
  let nearestIndex = 0;
  let nearestDistanceM = Number.POSITIVE_INFINITY;

  for (let i = 0; i < route.length; i++) {
    const distanceM = haversineM(place, route[i]);
    if (distanceM < nearestDistanceM) {
      nearestDistanceM = distanceM;
      nearestIndex = i;
    }
  }

  return { distanceAlongRouteM: distances[nearestIndex], distanceFromRouteM: nearestDistanceM };
}

interface ProjectedCandidate {
  place: FoodPlace;
  distanceAlongRouteM: number;
  distanceFromRouteM: number;
  arrivalTime: Date;
  isOpenAtArrival: boolean | "unknown";
  mealType: MealType;
}

function findCorridorCandidates(
  input: FoodStopPlanningInput,
  distances: number[],
): Array<{ place: FoodPlace; distanceAlongRouteM: number; distanceFromRouteM: number }> {
  const corridorDistanceM = input.corridorDistanceM ?? DEFAULT_CORRIDOR_DISTANCE_M;

  return input.places
    .map((place) => ({ place, ...nearestRoutePoint(place, input.route, distances) }))
    .filter((candidate) => candidate.distanceFromRouteM <= corridorDistanceM)
    .sort((a, b) => a.distanceAlongRouteM - b.distanceAlongRouteM);
}

function projectArrivalTime(
  startTime: Date,
  distanceAlongRouteM: number,
  averageSpeedKmh: number,
): Date {
  const hours = distanceAlongRouteM / 1000 / averageSpeedKmh;
  return new Date(startTime.getTime() + hours * 60 * 60 * 1000);
}

function isOpenAt(hours: OpeningHours | undefined, date: Date): boolean | "unknown" {
  if (!hours) return "unknown";

  const windows = hours[date.getUTCDay()];
  if (!windows) return false;

  const minuteOfDay = date.getUTCHours() * MINUTES_PER_HOUR + date.getUTCMinutes();
  return windows.some((w) => minuteOfDay >= w.openMinute && minuteOfDay < w.closeMinute);
}

function classifyMeal(arrivalTime: Date): MealType {
  const minuteOfDay = arrivalTime.getUTCHours() * MINUTES_PER_HOUR + arrivalTime.getUTCMinutes();
  const isMealTime = MEAL_WINDOWS.some(
    (w) => minuteOfDay >= w.startMinute && minuteOfDay < w.endMinute,
  );
  return isMealTime ? "meal" : "snack";
}

function projectCandidates(
  candidates: Array<{ place: FoodPlace; distanceAlongRouteM: number; distanceFromRouteM: number }>,
  startTime: Date,
  averageSpeedKmh: number,
): ProjectedCandidate[] {
  return candidates.map((candidate) => {
    const arrivalTime = projectArrivalTime(
      startTime,
      candidate.distanceAlongRouteM,
      averageSpeedKmh,
    );
    return {
      ...candidate,
      arrivalTime,
      isOpenAtArrival: isOpenAt(candidate.place.hours, arrivalTime),
      mealType: classifyMeal(arrivalTime),
    };
  });
}

function selectSpacedStops(
  candidates: ProjectedCandidate[],
  targetSpacingM: number,
): ProjectedCandidate[] {
  const stops: ProjectedCandidate[] = [];
  let lastStopDistanceM = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    if (candidate.isOpenAtArrival === false) continue;
    if (candidate.distanceAlongRouteM - lastStopDistanceM < targetSpacingM) continue;
    stops.push(candidate);
    lastStopDistanceM = candidate.distanceAlongRouteM;
  }

  return stops;
}

function findBackupStops(
  candidates: ProjectedCandidate[],
  selectedStops: ProjectedCandidate[],
  targetSpacingM: number,
  totalDistanceM: number,
): ProjectedCandidate[] {
  const gapBoundaries = [0, ...selectedStops.map((s) => s.distanceAlongRouteM), totalDistanceM];
  const backups: ProjectedCandidate[] = [];

  for (let i = 0; i < gapBoundaries.length - 1; i++) {
    const gapStartM = gapBoundaries[i];
    const gapEndM = gapBoundaries[i + 1];
    if (gapEndM - gapStartM <= BACKUP_GAP_MULTIPLIER * targetSpacingM) continue;

    const closedInGap = candidates.filter(
      (c) =>
        c.isOpenAtArrival === false &&
        c.distanceAlongRouteM > gapStartM &&
        c.distanceAlongRouteM < gapEndM,
    );
    if (closedInGap.length === 0) continue;

    const highestRated = closedInGap.reduce((best, candidate) =>
      (candidate.place.rating ?? -Infinity) > (best.place.rating ?? -Infinity) ? candidate : best,
    );
    backups.push(highestRated);
  }

  return backups;
}

export function planFoodStops(input: FoodStopPlanningInput): FoodStopPlanningOutput {
  const distances = cumulativeDistances(input.route);
  const totalDistanceM = distances[distances.length - 1] ?? 0;
  const averageSpeedKmh = input.averageSpeedKmh ?? DEFAULT_AVERAGE_SPEED_KMH;
  const targetSpacingM = input.targetSpacingM ?? DEFAULT_TARGET_SPACING_M;

  const candidates = projectCandidates(
    findCorridorCandidates(input, distances),
    input.startTime,
    averageSpeedKmh,
  );
  const selectedStops = selectSpacedStops(candidates, targetSpacingM);
  const backupStops = findBackupStops(candidates, selectedStops, targetSpacingM, totalDistanceM);

  const stops: FoodStopRecommendation[] = [...selectedStops, ...backupStops]
    .sort((a, b) => a.distanceAlongRouteM - b.distanceAlongRouteM)
    .map((candidate) => ({
      place: candidate.place,
      distanceAlongRouteM: candidate.distanceAlongRouteM,
      distanceFromRouteM: candidate.distanceFromRouteM,
      arrivalTime: candidate.arrivalTime,
      isOpenAtArrival: candidate.isOpenAtArrival,
      mealType: candidate.mealType,
      isBackup: backupStops.includes(candidate),
    }));

  return { stops, totalDistanceM, averageSpeedKmh };
}
