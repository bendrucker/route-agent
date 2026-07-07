import type { LocalKnowledgeFinding, RideReportsSummary } from "./types";

function dedupeFindings(findings: LocalKnowledgeFinding[]): LocalKnowledgeFinding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = finding.summary.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function organizeFindings(findings: LocalKnowledgeFinding[]): RideReportsSummary {
  const deduped = dedupeFindings(findings);

  return {
    hazards: deduped.filter((f) => f.category === "hazard"),
    conditions: deduped.filter((f) => f.category === "condition"),
    recommendations: deduped.filter((f) => f.category === "recommendation"),
    sourceCount: new Set(deduped.map((f) => f.source.url)).size,
  };
}
