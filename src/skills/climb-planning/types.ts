import type { BoundingBox, ClimbNarratives, ClimbRatings, ClimbSummary } from "../../pjamm/types";

export type DifficultyTier = "easy" | "moderate" | "hard" | "epic";

export type Sequencing = "hardest-first" | "save-legs";

/** A search result, optionally enriched with detail from the get-climb tool. */
export interface ClimbCandidate extends ClimbSummary {
  narratives?: ClimbNarratives;
  ratings?: ClimbRatings;
}

export interface ClimbPreferences {
  targetDifficulty?: DifficultyTier;
  /** Maximum climbs to select. Default 3. */
  maxClimbs?: number;
  /** Exclude climbs the rider has already ridden. */
  newClimbsOnly?: boolean;
  /** "hardest-first" hits the hardest climb on fresh legs; "save-legs" warms up on easier climbs first. Default "hardest-first". */
  sequencing?: Sequencing;
}

export interface ClimbPlanningInput {
  climbs: ClimbCandidate[];
  /** Optional area filter on climb start coordinates. */
  bounds?: BoundingBox;
  /** PJAMM climb ids the rider has already ridden (matched from Strava history). */
  riddenClimbIds?: number[];
  preferences?: ClimbPreferences;
}

export interface ClimbPick {
  climb: ClimbCandidate;
  /** 1-based ride order. */
  order: number;
  alreadyRidden: boolean;
}

export interface ClimbPlanningOutput {
  picks: ClimbPick[];
  alternates: { easier: ClimbCandidate[]; harder: ClimbCandidate[] };
  totalElevGainFt: number;
  sequencing: Sequencing;
  targetDifficulty?: DifficultyTier;
}

export type { BoundingBox, ClimbNarratives, ClimbRatings, ClimbSummary } from "../../pjamm/types";
