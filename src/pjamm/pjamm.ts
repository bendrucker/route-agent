import type { BoundingBox, Climb, ClimbPhoto, ClimbSummary } from "./types";
import { COUNTRY_ZONES } from "./zones";

const BASE_URL = "https://pjammcycling.com";

const STATE_PATTERN = /<script id="app-main-state" type="application\/json">([\s\S]*?)<\/script>/;

interface RawZoneClimb {
  id: string;
  title: string;
  country: string | null;
  state: string | null;
  city: string | null;
  distance: string | null;
  elevGain: string | null;
  avgGrad: string | null;
  fiets: string | null;
  pdi: string | null;
  worldRank: string | null;
  latStart: string | null;
  longStart: string | null;
}

interface RawSlide {
  picURL: string | null;
  picComment: string | null;
  lat: string | null;
  lng: string | null;
}

interface RawClimbPage extends Omit<RawZoneClimb, "worldRank"> {
  wrldRank: string | null;
  latEnd: string | null;
  longEnd: string | null;
  elevStart: string | null;
  elevEnd: string | null;
  difficultyRating: string | null;
  roadRating: string | null;
  trafficRating: string | null;
  sceneryRating: string | null;
  summary: string | null;
  gradientText: string | null;
  roadwayText: string | null;
  gearText: string | null;
  travelText: string | null;
  locationText: string | null;
  slideshows: { name: string | null; slides: RawSlide[] | null }[] | null;
}

interface RawZonePage {
  zone?: {
    climbs?: RawZoneClimb[];
  };
}

async function fetchPageState(path: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`PJAMM error: ${response.status} fetching ${path}`);
  }
  const html = await response.text();
  const match = html.match(STATE_PATTERN);
  if (!match) {
    throw new Error(`PJAMM error: no prerendered state found at ${path}`);
  }
  return JSON.parse(match[1]) as Record<string, unknown>;
}

function toNumber(value: string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toOptionalNumber(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Narrative fields embed rich-text HTML; reduce to plain text for LLM consumption. */
function cleanText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:div|p)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toPhotos(id: number, slideshows: RawClimbPage["slideshows"]): ClimbPhoto[] {
  return (slideshows ?? []).flatMap((slideshow) =>
    (slideshow.slides ?? [])
      .filter((slide) => slide.picURL)
      .map((slide) => {
        const photo: ClimbPhoto = {
          // Only the small_ rendition is publicly hosted. Originals 404.
          url: `${BASE_URL}/images/rides/ride${id}/small_${slide.picURL}`,
          comment: slide.picComment ?? "",
        };
        const lat = toOptionalNumber(slide.lat);
        const lng = toOptionalNumber(slide.lng);
        if (lat !== undefined) photo.lat = lat;
        if (lng !== undefined) photo.lng = lng;
        return photo;
      }),
  );
}

function toRatings(raw: RawClimbPage): Climb["ratings"] {
  const ratings: Climb["ratings"] = {};
  const difficulty = toOptionalNumber(raw.difficultyRating);
  const road = toOptionalNumber(raw.roadRating);
  const traffic = toOptionalNumber(raw.trafficRating);
  const scenery = toOptionalNumber(raw.sceneryRating);
  if (difficulty !== undefined) ratings.difficulty = difficulty;
  if (road !== undefined) ratings.road = road;
  if (traffic !== undefined) ratings.traffic = traffic;
  if (scenery !== undefined) ratings.scenery = scenery;
  return ratings;
}

function toClimb(raw: RawClimbPage): Climb {
  const id = toNumber(raw.id);
  const worldRank = toOptionalNumber(raw.wrldRank);
  return {
    id,
    name: raw.title ?? "",
    lat: toNumber(raw.latStart),
    lng: toNumber(raw.longStart),
    country: raw.country ?? "",
    state: raw.state ?? "",
    city: raw.city ?? "",
    distanceMi: toNumber(raw.distance),
    elevGainFt: toNumber(raw.elevGain),
    avgGradePercent: toNumber(raw.avgGrad),
    fiets: toNumber(raw.fiets),
    pdi: toNumber(raw.pdi),
    ...(worldRank !== undefined ? { worldRank } : {}),
    endLat: toNumber(raw.latEnd),
    endLng: toNumber(raw.longEnd),
    elevStartFt: toNumber(raw.elevStart),
    elevEndFt: toNumber(raw.elevEnd),
    ratings: toRatings(raw),
    narratives: {
      summary: cleanText(raw.summary),
      gradient: cleanText(raw.gradientText),
      roadway: cleanText(raw.roadwayText),
      gear: cleanText(raw.gearText),
      travel: cleanText(raw.travelText),
      location: cleanText(raw.locationText),
    },
    photos: toPhotos(id, raw.slideshows),
  };
}

function toClimbSummary(raw: RawZoneClimb): ClimbSummary {
  const worldRank = toOptionalNumber(raw.worldRank);
  return {
    id: toNumber(raw.id),
    name: raw.title ?? "",
    lat: toNumber(raw.latStart),
    lng: toNumber(raw.longStart),
    country: raw.country ?? "",
    state: raw.state ?? "",
    city: raw.city ?? "",
    distanceMi: toNumber(raw.distance),
    elevGainFt: toNumber(raw.elevGain),
    avgGradePercent: toNumber(raw.avgGrad),
    fiets: toNumber(raw.fiets),
    pdi: toNumber(raw.pdi),
    ...(worldRank !== undefined ? { worldRank } : {}),
  };
}

export async function fetchClimb(id: number): Promise<Climb> {
  const state = await fetchPageState(`/climb/${id}`);
  const raw = state[`climbPageData-${id}`] as RawClimbPage | undefined;
  if (!raw?.id) {
    throw new Error(`PJAMM error: no climb data for id ${id}`);
  }
  return toClimb(raw);
}

async function fetchZoneClimbs(zoneId: number): Promise<ClimbSummary[]> {
  const state = await fetchPageState(`/zone/${zoneId}`);
  const raw = state[`zonePageData-${zoneId}`] as RawZonePage | undefined;
  const climbs = raw?.zone?.climbs;
  if (!climbs) {
    throw new Error(`PJAMM error: no zone data for id ${zoneId}`);
  }
  return climbs.map(toClimbSummary);
}

// Zone pages are large and change rarely. Cache per process so repeated
// searches in a session fetch each zone at most once.
const zoneCache = new Map<number, Promise<ClimbSummary[]>>();

function cachedZoneClimbs(zoneId: number): Promise<ClimbSummary[]> {
  let climbs = zoneCache.get(zoneId);
  if (!climbs) {
    climbs = fetchZoneClimbs(zoneId);
    climbs.catch(() => zoneCache.delete(zoneId));
    zoneCache.set(zoneId, climbs);
  }
  return climbs;
}

function intersects(a: BoundingBox, b: BoundingBox): boolean {
  return a.south <= b.north && a.north >= b.south && a.west <= b.east && a.east >= b.west;
}

function contains(bounds: BoundingBox, lat: number, lng: number): boolean {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}

export async function searchClimbs(bounds: BoundingBox): Promise<ClimbSummary[]> {
  const zones = COUNTRY_ZONES.filter((zone) => zone.boxes.some((box) => intersects(box, bounds)));
  const zoneClimbs = await Promise.all(zones.map((zone) => cachedZoneClimbs(zone.id)));
  const results = new Map<number, ClimbSummary>();
  for (const climbs of zoneClimbs) {
    for (const climb of climbs) {
      if (contains(bounds, climb.lat, climb.lng)) {
        results.set(climb.id, climb);
      }
    }
  }
  return [...results.values()].sort((a, b) => b.pdi - a.pdi);
}
