import type { HistoryAnalysisOutput } from "./types";

const corePrompt = `Analyze this cyclist's ride history to inform route planning. Use familiar roads as reliable building blocks and flag new territory as exploration opportunities.`;

function familiarityContext(output: HistoryAnalysisOutput): string {
  if (output.relevantActivities.length === 0) {
    return "No prior rides in this area — all roads are new. Prioritize well-known routes and flag uncertainty about conditions.";
  }
  if (output.relevantActivities.length < 3) {
    return "Few prior rides in this area. Mix familiar roads with new ones for a balanced route.";
  }
  return "";
}

function segmentsContext(output: HistoryAnalysisOutput): string {
  if (output.reusableSegments.length === 0) return "";
  return `${output.reusableSegments.length} known segments available — prefer incorporating these as they mark interesting road sections with benchmark data.`;
}

export function buildHistoryPrompt(output: HistoryAnalysisOutput): string {
  const sections = [corePrompt, familiarityContext(output), segmentsContext(output)].filter(
    Boolean,
  );

  return sections.join("\n\n");
}
