import type { NarrativeNote, NarrativeResearchOutput } from "./types";

const corePrompt = `Weave local knowledge into the final route presentation as narrative notes, not a research appendix. Write in a local-intel voice ("watch for...", "locals recommend...") and integrate each note at the point in the write-up where it's relevant, rather than listing them separately at the end.`;

function describeNote(note: NarrativeNote): string {
  const location = note.place ? ` near ${note.place}` : "";
  return `${note.category}${location}: ${note.summary} (per ${note.source.title})`;
}

function notesContext(output: NarrativeResearchOutput): string {
  if (output.notes.length === 0) return "";
  return output.notes.map(describeNote).join("\n");
}

const degradationGuidance = `No narrative notes were found for this route. Skip narrative notes entirely rather than inventing local intel, and present the route on the strength of the other research.`;

function degradationContext(output: NarrativeResearchOutput): string {
  return output.notes.length === 0 ? degradationGuidance : "";
}

export function buildNarrativePrompt(output: NarrativeResearchOutput): string {
  const sections = [corePrompt, notesContext(output), degradationContext(output)].filter(Boolean);
  return sections.join("\n\n");
}
