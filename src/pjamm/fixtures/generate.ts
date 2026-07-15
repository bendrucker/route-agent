/**
 * Generates the committed fetch-vcr fixtures for pjamm.test.ts.
 *
 * The fixtures are synthetic: they mirror the structure of PJAMM's prerendered
 * SSR state (the `app-main-state` script blob) but contain only a small sample
 * of factual climb stats plus placeholder narrative text. PJAMM's narrative
 * prose, photo captions, GPX tracks, and full climb database are copyrighted;
 * do not commit real recordings. `LIVE_API=1 bun test src/pjamm` re-records
 * real pages over these files for local verification only. Regenerate with
 * `bun src/pjamm/fixtures/generate.ts` before committing.
 */

import { join } from "node:path";

const marinClimbs = [
  ["349", "Mt. Tam via Panoramic Hwy North", "Stinson Beach", "6.56", "2397", "6.9", "5.04", "14.66", "1627", "37.89633", "-122.6365"],
  ["344", "Mt. Tam via Fairfax-Bolinas Road", "Bolinas", "9.76", "2677", "4.8", "3.68", "13.11", "1869", "37.93507", "-122.69697"],
  ["4099", "Mt. Tam from Miller Ave", "Mill Valley", "9.55", "2596", "4.9", "3.68", "12.79", "1929", "37.897127", "-122.537652"],
  ["348", "Mt. Tam via  Hwy 1 South", "Tamalpais-Homestead Valley", "10.27", "2675", "4.56", "3.51", "12.7", "1950", "37.87956", "-122.53505"],
  ["351", "Mt. Tam via Muir Woods", "Mill Valley", "8.94", "2486", "4.96", "3.56", "12.37", "2014", "37.892", "-122.57042"],
  ["2841", "Mt. Tam from Marion Ave", "Mill Valley", "9.51", "2438", "4.67", "3.32", "11.63", "2160", "37.906929", "-122.559526"],
  ["350", "Mt. Tam via Alpine Dam", "Bolinas", "7.85", "2053", "4.5", "2.6", "9.7", "2571", "37.9401", "-122.63846"],
  ["343", "Fairfax-Bolinas Road", "Bolinas", "4.39", "1507", "6.41", "2.98", "8.74", "2816", "37.93507", "-122.69697"],
  ["2357", "Hawk Hill", "Sausalito", "1.77", "538", "5.78", "0.95", "2.88", "4943", "37.83373", "-122.48372"],
] as const;

const zoneClimbs = [
  ...marinClimbs.map(
    ([id, title, city, distance, elevGain, avgGrad, fiets, pdi, worldRank, latStart, longStart]) => ({
      id,
      title,
      country: "USA",
      state: "CA",
      county: "Marin County",
      city,
      distance,
      elevGain,
      avgGrad,
      fiets,
      pdi,
      worldRank,
      latStart,
      longStart,
    }),
  ),
  {
    id: "7",
    title: "Haleakala",
    country: "USA",
    state: "HI",
    county: "Maui County",
    city: "Paia",
    distance: "35.35",
    elevGain: "10070",
    avgGrad: "5.36",
    fiets: "18.31",
    pdi: "58.19",
    worldRank: "23",
    latStart: "20.91607",
    longStart: "-156.38125",
  },
];

const alpeDHuez = {
  id: "118",
  title: "Alpe d'Huez",
  country: "France",
  state: "Auvergne-Rhône-Alpes",
  city: "Le Bourg-d'Oisans",
  distance: "8.67",
  elevGain: "3543",
  avgGrad: "7.73",
  fiets: "9.13",
  pdi: "24.56",
  wrldRank: "579",
  latStart: "45.060539",
  longStart: "6.037691",
  latEnd: "45.09457",
  longEnd: "6.070955",
  elevStart: "2375",
  elevEnd: "5906",
  difficultyRating: "4.2",
  roadRating: "4.2",
  trafficRating: "3.2",
  sceneryRating: "3.8",
  summary:
    "Synthetic fixture summary: the most famous climb in cycling, with 21 numbered hairpins.&nbsp;<div><br></div><div>Second paragraph exercising HTML cleanup.</div>",
  gradientText:
    "Synthetic fixture gradient notes: steady grades around 8% with brief steeper pitches.",
  roadwayText: "Synthetic fixture roadway notes: wide alpine road with numbered hairpins.",
  gearText: "Synthetic fixture gear notes: compact gearing recommended.",
  travelText: "Synthetic fixture travel notes: start from the valley town at the base.",
  locationText: "Synthetic fixture location notes: French Alps, southeast of Grenoble.",
  slideshows: [
    {
      name: "Fixture Slideshow",
      slides: [
        {
          id: "58311",
          picURL: "climb118picd10a.jpeg",
          picComment: "Synthetic fixture photo",
          lat: "45.059477777778",
          lng: "6.0379583333333",
        },
      ],
    },
  ],
};

function page(state: Record<string, unknown>): string {
  const json = JSON.stringify(state);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Fixture</title></head><body><app-root></app-root><script id="app-main-state" type="application/json">${json}</script></body></html>\n`;
}

const fixtures = [
  {
    url: "https://pjammcycling.com/climb/118",
    file: "https%3A__pjammcycling.com_climb_118_GET_3938",
    body: page({ "climbPageData-118": alpeDHuez }),
  },
  {
    url: "https://pjammcycling.com/climb/9999999",
    file: "https%3A__pjammcycling.com_climb_9999999_GET_3938",
    body: page({ __nghData__: [] }),
  },
  {
    url: "https://pjammcycling.com/zone/1",
    file: "https%3A__pjammcycling.com_zone_1_GET_3938",
    body: page({
      "zonePageData-1": {
        success: true,
        message: "Success loading climb zone.",
        zone: {
          details: {
            id: "1",
            name: "United States",
            navGroup: "_Country Pages",
            queryAtt: "country",
            queryValue: "USA",
          },
          climbs: zoneClimbs,
        },
      },
    }),
  },
];

for (const fixture of fixtures) {
  const options = {
    url: fixture.url,
    status: 200,
    statusText: "OK",
    ok: true,
    headers: { "content-type": ["text/html; charset=utf-8"] },
  };
  await Bun.write(join(import.meta.dir, `${fixture.file}_body.raw`), fixture.body);
  await Bun.write(
    join(import.meta.dir, `${fixture.file}_options.json`),
    `${JSON.stringify(options)}\n`,
  );
  console.log(`wrote ${fixture.file}`);
}
