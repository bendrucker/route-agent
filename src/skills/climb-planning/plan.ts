import type {
  BoundingBox,
  ClimbCandidate,
  ClimbPick,
  ClimbPlanningInput,
  ClimbPlanningOutput,
  DifficultyTier,
  Sequencing,
} from "./types";

const DEFAULT_MAX_CLIMBS = 3;
const DEFAULT_SEQUENCING: Sequencing = "hardest-first";
const MAX_ALTERNATES_PER_SIDE = 2;

const TIER_ORDER: DifficultyTier[] = ["easy", "moderate", "hard", "epic"];

// Cutoffs calibrated against PJAMM reference climbs: Hawk Hill 2.9 (easy),
// the Mt. Tam routes 10-15 (moderate), Alpe d'Huez 24.6 (upper hard),
// Haleakala 58 (epic). PJAMM publishes no official tier boundaries.
export function difficultyTier(pdi: number): DifficultyTier {
  if (pdi < 8) return "easy";
  if (pdi < 15) return "moderate";
  if (pdi < 25) return "hard";
  return "epic";
}

function tierOrdinal(tier: DifficultyTier): number {
  return TIER_ORDER.indexOf(tier);
}

function inBounds(climb: ClimbCandidate, bounds: BoundingBox): boolean {
  return (
    climb.lat >= bounds.south &&
    climb.lat <= bounds.north &&
    climb.lng >= bounds.west &&
    climb.lng <= bounds.east
  );
}

function selectionOrder(
  a: ClimbCandidate,
  b: ClimbCandidate,
  targetDifficulty: DifficultyTier | undefined,
): number {
  if (targetDifficulty) {
    const distanceA = Math.abs(tierOrdinal(difficultyTier(a.pdi)) - tierOrdinal(targetDifficulty));
    const distanceB = Math.abs(tierOrdinal(difficultyTier(b.pdi)) - tierOrdinal(targetDifficulty));
    if (distanceA !== distanceB) return distanceA - distanceB;
  }
  if (a.pdi !== b.pdi) return b.pdi - a.pdi;
  return a.id - b.id;
}

function selectPicks(
  pool: ClimbCandidate[],
  targetDifficulty: DifficultyTier | undefined,
  maxClimbs: number,
): ClimbCandidate[] {
  return [...pool].sort((a, b) => selectionOrder(a, b, targetDifficulty)).slice(0, maxClimbs);
}

function sequencePicks(
  picks: ClimbCandidate[],
  sequencing: Sequencing,
  riddenIds: Set<number>,
): ClimbPick[] {
  const sorted = [...picks].sort((a, b) => {
    if (a.pdi !== b.pdi) return sequencing === "hardest-first" ? b.pdi - a.pdi : a.pdi - b.pdi;
    return a.id - b.id;
  });
  return sorted.map((climb, index) => ({
    climb,
    order: index + 1,
    alreadyRidden: riddenIds.has(climb.id),
  }));
}

function selectAlternates(
  remaining: ClimbCandidate[],
  referenceTier: DifficultyTier,
): ClimbPlanningOutput["alternates"] {
  const referenceOrdinal = tierOrdinal(referenceTier);

  const easier = remaining
    .filter((climb) => tierOrdinal(difficultyTier(climb.pdi)) < referenceOrdinal)
    .sort((a, b) => (a.pdi !== b.pdi ? b.pdi - a.pdi : a.id - b.id))
    .slice(0, MAX_ALTERNATES_PER_SIDE);

  const harder = remaining
    .filter((climb) => tierOrdinal(difficultyTier(climb.pdi)) > referenceOrdinal)
    .sort((a, b) => (a.pdi !== b.pdi ? a.pdi - b.pdi : a.id - b.id))
    .slice(0, MAX_ALTERNATES_PER_SIDE);

  return { easier, harder };
}

export function planClimbs(input: ClimbPlanningInput): ClimbPlanningOutput {
  const preferences = input.preferences ?? {};
  const maxClimbs = Math.max(0, preferences.maxClimbs ?? DEFAULT_MAX_CLIMBS);
  const sequencing = preferences.sequencing ?? DEFAULT_SEQUENCING;
  const riddenIds = new Set(input.riddenClimbIds ?? []);

  const { bounds } = input;
  const inArea = bounds ? input.climbs.filter((climb) => inBounds(climb, bounds)) : input.climbs;
  const pool = preferences.newClimbsOnly
    ? inArea.filter((climb) => !riddenIds.has(climb.id))
    : inArea;

  const selected = selectPicks(pool, preferences.targetDifficulty, maxClimbs);
  const picks = sequencePicks(selected, sequencing, riddenIds);

  const selectedIds = new Set(selected.map((climb) => climb.id));
  const remaining = pool.filter((climb) => !selectedIds.has(climb.id));
  const hardestPick = picks.reduce<ClimbCandidate | undefined>(
    (hardest, pick) => (!hardest || pick.climb.pdi > hardest.pdi ? pick.climb : hardest),
    undefined,
  );
  const referenceTier =
    preferences.targetDifficulty ?? (hardestPick ? difficultyTier(hardestPick.pdi) : undefined);
  const alternates = referenceTier
    ? selectAlternates(remaining, referenceTier)
    : { easier: [], harder: [] };

  return {
    picks,
    alternates,
    totalElevGainFt: picks.reduce((sum, pick) => sum + pick.climb.elevGainFt, 0),
    sequencing,
    targetDifficulty: preferences.targetDifficulty,
  };
}
