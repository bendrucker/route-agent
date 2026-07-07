import type { LocalKnowledgeCategory, Source } from "../ride-reports";

export interface RoutePlace {
  name: string;
  kind?: "climb" | "town" | "landmark" | "intersection";
}

export interface NarrativeNote {
  category: LocalKnowledgeCategory;
  summary: string;
  source: Source;
  place?: string;
}

export interface NarrativeResearchOutput {
  notes: NarrativeNote[];
  sourceCount: number;
}
