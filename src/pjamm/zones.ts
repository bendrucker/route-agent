import { GENERATED_COUNTRY_ZONES } from "./country-zones";
import type { BoundingBox } from "./types";

export interface CountryZone {
  id: number;
  name: string;
  boxes: BoundingBox[];
}

/**
 * Country-level zone pages. Ids and names come from
 * https://pjammcycling.com/sitemap.xml. Every PJAMM climb belongs to a country
 * zone (the pages query by country), so these give complete coverage without
 * crawling the site: a search fetches only the zone page(s) whose bounds
 * intersect the requested bounding box.
 *
 * Bounds come from Natural Earth country polygons via generate-zones.ts, one
 * box per landmass group so overseas territories (the Canary Islands, Réunion,
 * Hawaii) are covered without spanning oceans. Climbs are filtered by exact
 * start coordinates after the zone page is fetched, so overlap between
 * neighboring countries only costs an extra page fetch.
 */
export const COUNTRY_ZONES: CountryZone[] = GENERATED_COUNTRY_ZONES;
