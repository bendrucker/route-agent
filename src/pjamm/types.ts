export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface ClimbSummary {
  id: number;
  name: string;
  lat: number;
  lng: number;
  country: string;
  state: string;
  city: string;
  distanceMi: number;
  elevGainFt: number;
  avgGradePercent: number;
  fiets: number;
  pdi: number;
  worldRank?: number;
}

export interface ClimbRatings {
  difficulty?: number;
  road?: number;
  traffic?: number;
  scenery?: number;
}

export interface ClimbNarratives {
  summary: string;
  gradient: string;
  roadway: string;
  gear: string;
  travel: string;
  location: string;
}

export interface ClimbPhoto {
  url: string;
  comment: string;
  lat?: number;
  lng?: number;
}

export interface Climb extends ClimbSummary {
  endLat: number;
  endLng: number;
  elevStartFt: number;
  elevEndFt: number;
  ratings: ClimbRatings;
  narratives: ClimbNarratives;
  photos: ClimbPhoto[];
}
