const corePrompt = `Search the web for ride reports and forum posts about cycling in this area. Use your native web search to find first-hand accounts from cyclists who have ridden here.`;

function searchGuidance(area: string): string {
  return `Try queries like "${area} cycling ride report", "${area} bike route reddit", "${area} cycling club forum", and "${area} strava ride review". Check cycling forums (e.g. Reddit r/cycling, r/bicycling, local subreddits), local bike club sites, and cyclist blogs.`;
}

const extractionGuidance = `From each report, extract:
- Hazards: dangerous intersections, unmarked construction, aggressive dogs, poor pavement, high-traffic segments
- Conditions: current road/trail conditions, seasonal closures, surface quality
- Recommendations: suggested detours, best times to ride, scenic stops, parking

Attribute every finding to the source URL and title it came from. Do not invent findings that aren't grounded in a specific report.`;

const degradationGuidance = `If no relevant ride reports or forum posts turn up, say so plainly and proceed with route planning using other sources. Do not fabricate local knowledge to fill the gap.`;

export function buildRideReportsPrompt(area: string): string {
  return [corePrompt, searchGuidance(area), extractionGuidance, degradationGuidance].join("\n\n");
}
