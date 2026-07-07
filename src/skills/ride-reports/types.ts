export type LocalKnowledgeCategory = "hazard" | "condition" | "recommendation";

export interface Source {
  url: string;
  title: string;
}

export interface LocalKnowledgeFinding {
  category: LocalKnowledgeCategory;
  summary: string;
  source: Source;
}

export interface RideReportsSummary {
  hazards: LocalKnowledgeFinding[];
  conditions: LocalKnowledgeFinding[];
  recommendations: LocalKnowledgeFinding[];
  sourceCount: number;
}
