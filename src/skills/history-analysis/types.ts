export interface GeographicBounds {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

export interface ActivitySummary {
  id: number;
  name: string;
  distance: number;
  elevationGain: number;
  movingTime: number;
  startLatLng: [number, number];
}

export interface SegmentSummary {
  id: number;
  name: string;
  distance: number;
  avgGrade: number;
  elevDifference: number;
}

export interface RouteSummary {
  id: number;
  name: string;
  distance: number;
  elevationGain: number;
}

export interface MetricSummary {
  avg: number;
  max: number;
}

export interface RidingPreferences {
  rideCount: number;
  distance: MetricSummary;
  elevation: MetricSummary;
  duration: MetricSummary;
}

export interface HistoryAnalysisInput {
  area: GeographicBounds;
  activities: ActivitySummary[];
  segments: SegmentSummary[];
  routes: RouteSummary[];
  preferences: RidingPreferences;
}

export interface HistoryAnalysisOutput {
  relevantActivities: ActivitySummary[];
  reusableSegments: SegmentSummary[];
  preferences: RidingPreferences;
}
