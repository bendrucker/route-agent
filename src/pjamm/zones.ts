import type { BoundingBox } from "./types";

export interface CountryZone {
  id: number;
  name: string;
  bounds: BoundingBox;
}

/**
 * Country-level zone pages. Ids and names come from
 * https://pjammcycling.com/sitemap.xml. Every PJAMM climb belongs to a country
 * zone (the pages query by country), so these give complete coverage without
 * crawling the site: a search fetches only the zone page(s) whose bounds
 * intersect the requested bounding box.
 *
 * Bounds are hand-maintained approximate country bounding boxes, kept generous
 * (including outlying islands where PJAMM documents climbs there). Climbs are
 * filtered by exact start coordinates after the zone page is fetched, so
 * overlap between neighboring boxes only costs an extra page fetch.
 */
export const COUNTRY_ZONES: CountryZone[] = [
  { id: 1, name: "United States", bounds: { south: 18, west: -180, north: 72, east: -66 } },
  { id: 37, name: "Italy", bounds: { south: 35.4, west: 6.6, north: 47.2, east: 18.6 } },
  { id: 61, name: "France", bounds: { south: 41.2, west: -5.3, north: 51.2, east: 9.7 } },
  { id: 62, name: "United Kingdom", bounds: { south: 49.8, west: -8.7, north: 60.9, east: 1.8 } },
  { id: 64, name: "Switzerland", bounds: { south: 45.7, west: 5.9, north: 47.9, east: 10.6 } },
  { id: 65, name: "Austria", bounds: { south: 46.3, west: 9.4, north: 49.1, east: 17.2 } },
  { id: 66, name: "Spain", bounds: { south: 27.5, west: -18.4, north: 43.9, east: 4.4 } },
  { id: 79, name: "Germany", bounds: { south: 47.2, west: 5.8, north: 55.1, east: 15.1 } },
  { id: 140, name: "Canada", bounds: { south: 41.6, west: -141.1, north: 83.2, east: -52.5 } },
  { id: 146, name: "Croatia", bounds: { south: 42.3, west: 13.4, north: 46.6, east: 19.5 } },
  { id: 193, name: "Norway", bounds: { south: 57.9, west: 4.5, north: 71.3, east: 31.2 } },
  { id: 196, name: "Chile", bounds: { south: -56, west: -110, north: -17.4, east: -66.3 } },
  { id: 200, name: "Portugal", bounds: { south: 32.4, west: -31.5, north: 42.2, east: -6.2 } },
  { id: 202, name: "Taiwan", bounds: { south: 21.8, west: 119.9, north: 25.4, east: 122.1 } },
  { id: 203, name: "Japan", bounds: { south: 24, west: 122.9, north: 45.7, east: 146.1 } },
  { id: 204, name: "Colombia", bounds: { south: -4.3, west: -79.1, north: 13.6, east: -66.8 } },
  { id: 205, name: "Thailand", bounds: { south: 5.5, west: 97.3, north: 20.5, east: 105.7 } },
  { id: 206, name: "Bolivia", bounds: { south: -22.9, west: -69.7, north: -9.6, east: -57.4 } },
  { id: 207, name: "Australia", bounds: { south: -43.8, west: 112.9, north: -10.6, east: 153.7 } },
  { id: 212, name: "Mexico", bounds: { south: 14.5, west: -118.5, north: 32.8, east: -86.6 } },
  { id: 213, name: "Belgium", bounds: { south: 49.5, west: 2.5, north: 51.6, east: 6.5 } },
  { id: 214, name: "Ireland", bounds: { south: 51.4, west: -10.7, north: 55.5, east: -5.9 } },
  {
    id: 292,
    name: "New Zealand",
    bounds: { south: -47.4, west: 166.3, north: -34.3, east: 178.6 },
  },
  { id: 302, name: "Andorra", bounds: { south: 42.4, west: 1.4, north: 42.7, east: 1.8 } },
  { id: 305, name: "China", bounds: { south: 18, west: 73.5, north: 53.6, east: 135.1 } },
  { id: 313, name: "Slovakia", bounds: { south: 47.7, west: 16.8, north: 49.7, east: 22.6 } },
  { id: 314, name: "Romania", bounds: { south: 43.6, west: 20.2, north: 48.3, east: 29.8 } },
  { id: 373, name: "Saudi Arabia", bounds: { south: 16.3, west: 34.4, north: 32.2, east: 55.7 } },
  { id: 375, name: "Peru", bounds: { south: -18.4, west: -81.4, north: 0, east: -68.6 } },
  { id: 404, name: "Brazil", bounds: { south: -33.8, west: -74, north: 5.3, east: -34.7 } },
];
