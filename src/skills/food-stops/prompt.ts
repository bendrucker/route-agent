import type { FoodStopPlanningOutput, FoodStopRecommendation } from "./types";

const corePrompt = `Plan food stops along this route based on projected arrival times and business hours. Distinguish full meals from quick snacks.`;

function coverageContext(output: FoodStopPlanningOutput): string {
  if (output.stops.length > 0) return "";
  return "No food stops found along the route corridor. Advise the rider to pack enough food for the full ride.";
}

function formatTime(date: Date): string {
  const hour24 = date.getUTCHours();
  const minute = date.getUTCMinutes().toString().padStart(2, "0");
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period}`;
}

function mealLabel(stop: FoodStopRecommendation): string {
  if (stop.mealType === "snack") return "Snack";
  const hour = stop.arrivalTime.getUTCHours();
  if (hour < 11) return "Breakfast";
  if (hour < 17) return "Lunch";
  return "Dinner";
}

function describeStop(stop: FoodStopRecommendation): string {
  const distanceKm = (stop.distanceAlongRouteM / 1000).toFixed(1);
  const arrival = formatTime(stop.arrivalTime);

  if (stop.isBackup) {
    return `Backup only, closed at arrival: ${stop.place.name}: ${distanceKm} km (arrive ~${arrival}), consider packing food for this stretch`;
  }

  const status =
    stop.isOpenAtArrival === "unknown" ? "hours unknown, verify before relying on it" : "open";
  const rating = stop.place.rating !== undefined ? `, ${stop.place.rating.toFixed(1)}★` : "";

  return `${mealLabel(stop)} at ${stop.place.name}: ${distanceKm} km (arrive ~${arrival}), ${status}${rating}`;
}

function stopsContext(output: FoodStopPlanningOutput): string {
  if (output.stops.length === 0) return "";
  return output.stops.map(describeStop).join("\n");
}

export function buildFoodStopPrompt(output: FoodStopPlanningOutput): string {
  const sections = [corePrompt, coverageContext(output), stopsContext(output)].filter(Boolean);

  return sections.join("\n\n");
}
