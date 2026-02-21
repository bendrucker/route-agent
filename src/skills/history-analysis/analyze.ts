import type {
  ActivitySummary,
  GeographicBounds,
  HistoryAnalysisInput,
  HistoryAnalysisOutput,
  RidingPreferences,
} from "./types";

function isWithinBounds(latLng: [number, number], bounds: GeographicBounds): boolean {
  const [lat, lng] = latLng;
  return (
    lat >= bounds.sw.lat && lat <= bounds.ne.lat && lng >= bounds.sw.lng && lng <= bounds.ne.lng
  );
}

function filterActivitiesByArea(
  activities: ActivitySummary[],
  bounds: GeographicBounds,
): ActivitySummary[] {
  return activities.filter((a) => isWithinBounds(a.startLatLng, bounds));
}

function describeFamiliarRoads(activities: ActivitySummary[]): string[] {
  if (activities.length === 0) return [];
  return activities.map(
    (a) => `${a.name} (${(a.distance / 1000).toFixed(1)}km, ${a.elevationGain}m gain)`,
  );
}

function describeNewOpportunities(activitiesInArea: ActivitySummary[]): string[] {
  if (activitiesInArea.length === 0) {
    return ["No prior rides in this area — entirely new territory to explore"];
  }
  if (activitiesInArea.length < 3) {
    return ["Few rides in this area — likely many unexplored roads nearby"];
  }
  return [];
}

function computePreferences(activities: ActivitySummary[]): RidingPreferences {
  if (activities.length === 0) {
    return { avgDistance: 0, avgElevation: 0, avgDuration: 0 };
  }

  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
  const totalElevation = activities.reduce((sum, a) => sum + a.elevationGain, 0);
  const totalDuration = activities.reduce((sum, a) => sum + a.movingTime, 0);

  return {
    avgDistance: totalDistance / activities.length,
    avgElevation: totalElevation / activities.length,
    avgDuration: totalDuration / activities.length,
  };
}

export function analyzeHistory(input: HistoryAnalysisInput): HistoryAnalysisOutput {
  const relevantActivities = filterActivitiesByArea(input.activities, input.area);
  const familiarRoads = describeFamiliarRoads(relevantActivities);
  const newOpportunities = describeNewOpportunities(relevantActivities);
  const preferences = computePreferences(input.activities);

  return {
    relevantActivities,
    reusableSegments: input.segments,
    familiarRoads,
    newOpportunities,
    preferences,
  };
}
