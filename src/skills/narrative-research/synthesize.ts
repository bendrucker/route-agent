import type { LocalKnowledgeFinding, RideReportsSummary } from "../ride-reports";
import type { NarrativeNote, NarrativeResearchOutput, RoutePlace } from "./types";

// Naive substring match: no fuzzy matching, so place names that don't appear verbatim
// in a finding's summary (abbreviations, alternate spellings) won't be linked.
function matchPlace(summary: string, places: RoutePlace[]): string | undefined {
  const lowerSummary = summary.toLowerCase();
  return places.find((place) => lowerSummary.includes(place.name.toLowerCase()))?.name;
}

function toNote(finding: LocalKnowledgeFinding, places: RoutePlace[]): NarrativeNote {
  return {
    category: finding.category,
    summary: finding.summary,
    source: finding.source,
    place: matchPlace(finding.summary, places),
  };
}

export function synthesizeNarrative(
  summary: RideReportsSummary,
  places: RoutePlace[] = [],
): NarrativeResearchOutput {
  const findings = [...summary.hazards, ...summary.conditions, ...summary.recommendations];

  return {
    notes: findings.map((finding) => toNote(finding, places)),
    sourceCount: summary.sourceCount,
  };
}
