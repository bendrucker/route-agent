import type {
  ActivitySummary,
  GeographicBounds,
  HistoryAnalysisInput,
  HistoryAnalysisOutput,
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

export function analyzeHistory(input: HistoryAnalysisInput): HistoryAnalysisOutput {
  return {
    relevantActivities: filterActivitiesByArea(input.activities, input.area),
    reusableSegments: input.segments,
    preferences: input.preferences,
  };
}
