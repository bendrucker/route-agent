import { difficultyTier } from "./plan";
import type { ClimbCandidate, ClimbPick, ClimbPlanningOutput } from "./types";

const EFFORT_THRESHOLD_FT = 3000;
const SUMMARY_MAX_CHARS = 280;

const corePrompt = `Plan the climbing portion of this route around the selected climbs. Sequence the ride so it hits each climb in the recommended order.`;

function coverageContext(output: ClimbPlanningOutput): string {
  if (output.picks.length > 0) return "";
  return "No documented climbs matched the request. Advise widening the search area or relaxing the difficulty target.";
}

function describePick(pick: ClimbPick): string {
  const { climb } = pick;
  const distanceMi = climb.distanceMi.toFixed(1);
  const grade = climb.avgGradePercent.toFixed(1);
  const elevGainFt = Math.round(climb.elevGainFt);
  const pdi = climb.pdi.toFixed(1);
  const tier = difficultyTier(climb.pdi);
  const ridden = pick.alreadyRidden ? " — ridden before" : "";
  const line = `${pick.order}. ${climb.name} — ${distanceMi} mi at ${grade}%, ${elevGainFt} ft gain (PDI ${pdi}, ${tier})${ridden}`;

  if (!climb.narratives?.summary) return line;
  const summary = climb.narratives.summary.slice(0, SUMMARY_MAX_CHARS);
  return `${line}\n   ${summary}`;
}

function picksContext(output: ClimbPlanningOutput): string {
  if (output.picks.length === 0) return "";
  return output.picks.map(describePick).join("\n");
}

function sequencingContext(output: ClimbPlanningOutput): string {
  if (output.picks.length < 2) return "";
  return output.sequencing === "hardest-first"
    ? "Sequenced hardest first: the toughest climb comes while your legs are fresh."
    : "Sequenced to save your legs: easier climbs warm you up before the hardest effort.";
}

function effortContext(output: ClimbPlanningOutput): string {
  if (output.totalElevGainFt < EFFORT_THRESHOLD_FT) return "";
  return "This is a big elevation day. Emphasize pacing, fueling before the big climbs, and recovery between them.";
}

function describeAlternate(climb: ClimbCandidate): string {
  return `${climb.name} (PDI ${climb.pdi.toFixed(1)})`;
}

function alternatesContext(output: ClimbPlanningOutput): string {
  const lines: string[] = [];
  if (output.alternates.easier.length > 0) {
    lines.push(
      `If the plan feels too hard, consider: ${output.alternates.easier.map(describeAlternate).join(", ")}`,
    );
  }
  if (output.alternates.harder.length > 0) {
    lines.push(
      `To push harder, consider: ${output.alternates.harder.map(describeAlternate).join(", ")}`,
    );
  }
  return lines.join("\n");
}

export function buildClimbPrompt(output: ClimbPlanningOutput): string {
  const sections = [
    corePrompt,
    coverageContext(output),
    picksContext(output),
    sequencingContext(output),
    effortContext(output),
    alternatesContext(output),
  ].filter(Boolean);

  return sections.join("\n\n");
}
