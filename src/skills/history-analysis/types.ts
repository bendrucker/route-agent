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

export interface HistoryAnalysisInput {
  area: GeographicBounds;
  activities: ActivitySummary[];
  segments: SegmentSummary[];
  routes: RouteSummary[];
}

export interface RidingPreferences {
  avgDistance: number;
  avgElevation: number;
  avgDuration: number;
}

export interface HistoryAnalysisOutput {
  relevantActivities: ActivitySummary[];
  reusableSegments: SegmentSummary[];
  familiarRoads: string[];
  newOpportunities: string[];
  preferences: RidingPreferences;
}
