import type { WaterStopPlanningOutput, WaterStopRecommendation } from "./types";

const corePrompt = `Plan drinking-water refill stops along this route for hydration. Recommend fountains, water points, and stores for topping up.`;

function heatContext(output: WaterStopPlanningOutput): string {
  if (!output.isHotWeather) return "";
  return "Hot weather. Emphasize hydration and have riders refill at every recommended stop even if not yet thirsty.";
}

function coverageContext(output: WaterStopPlanningOutput): string {
  if (output.stops.length > 0) return "";
  const distanceKm = (output.totalDistanceM / 1000).toFixed(0);
  return output.isHotWeather
    ? `No water sources found within the route corridor over ${distanceKm} km in hot conditions. Advise carrying extra water or rerouting through a town.`
    : `No water sources found within the route corridor over ${distanceKm} km. Advise carrying enough water for the full ride.`;
}

function describeStop(stop: WaterStopRecommendation): string {
  const distanceKm = (stop.distanceAlongRouteM / 1000).toFixed(1);
  const label =
    stop.source.name ?? (stop.source.type === "drinking_water" ? "fountain" : "water point");
  const reliability =
    stop.source.type === "water_point" ? " (unmarked source, verify it's flowing)" : "";
  return `Refill at ${label}: ${distanceKm} km${reliability}`;
}

function stopsContext(output: WaterStopPlanningOutput): string {
  if (output.stops.length === 0) return "";
  return output.stops.map(describeStop).join("\n");
}

export function buildWaterStopPrompt(output: WaterStopPlanningOutput): string {
  const sections = [
    corePrompt,
    heatContext(output),
    coverageContext(output),
    stopsContext(output),
  ].filter(Boolean);

  return sections.join("\n\n");
}
