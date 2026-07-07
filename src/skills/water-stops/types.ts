import type { WaterSource } from "../../osm/types";

export interface RoutePoint {
  lat: number;
  lon: number;
}

export interface WaterStopPlanningInput {
  route: RoutePoint[];
  waterSources: WaterSource[];
  isHotWeather: boolean;
  /** Max distance (meters) from the route to consider a source. Default 500m. */
  corridorDistanceM?: number;
  /** Minimum spacing (meters) between recommended stops in normal conditions. Default 20000m. */
  normalSpacingM?: number;
  /** Minimum spacing (meters) between recommended stops in hot weather. Default 10000m. */
  hotWeatherSpacingM?: number;
}

export interface WaterStopRecommendation {
  source: WaterSource;
  distanceAlongRouteM: number;
  distanceFromRouteM: number;
}

export interface WaterStopPlanningOutput {
  stops: WaterStopRecommendation[];
  isHotWeather: boolean;
  totalDistanceM: number;
}

export type { WaterSource } from "../../osm/types";
