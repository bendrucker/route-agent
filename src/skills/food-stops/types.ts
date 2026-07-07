export interface RoutePoint {
  lat: number;
  lon: number;
}

export interface OpeningHours {
  /** 0 = Sunday .. 6 = Saturday. Missing day = closed. */
  [dayOfWeek: number]: Array<{ openMinute: number; closeMinute: number }>;
}

export interface FoodPlace {
  id: string;
  name: string;
  lat: number;
  lon: number;
  rating?: number;
  /** Undefined when the source didn't report hours. */
  hours?: OpeningHours;
}

export type MealType = "meal" | "snack";

export interface FoodStopPlanningInput {
  route: RoutePoint[];
  places: FoodPlace[];
  startTime: Date;
  /** Average riding speed in km/h, used to project arrival times. Default 20. */
  averageSpeedKmh?: number;
  /** Max distance (meters) from the route to consider a place. Default 500m. */
  corridorDistanceM?: number;
  /** Target spacing (meters) between recommended stops. Default 40000m. */
  targetSpacingM?: number;
}

export interface FoodStopRecommendation {
  place: FoodPlace;
  distanceAlongRouteM: number;
  distanceFromRouteM: number;
  arrivalTime: Date;
  isOpenAtArrival: boolean | "unknown";
  mealType: MealType;
  /** Included despite being closed, to fill an otherwise-empty gap. */
  isBackup: boolean;
}

export interface FoodStopPlanningOutput {
  stops: FoodStopRecommendation[];
  totalDistanceM: number;
  averageSpeedKmh: number;
}
