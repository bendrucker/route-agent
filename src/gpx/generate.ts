import type { RoutePath } from "../graphhopper/server";

export interface GpxOptions {
  name?: string;
  description?: string;
  startTime?: Date;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function estimateTimestamps(path: RoutePath, startTime: Date): Date[] {
  const coords = path.points.coordinates;
  if (coords.length === 0) return [];

  const totalDistance = path.distance;
  const totalTime = path.time;

  const timestamps: Date[] = [startTime];
  let cumulativeDistance = 0;

  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const segmentDistance = haversine(prev[1], prev[0], curr[1], curr[0]);
    cumulativeDistance += segmentDistance;

    const fraction = totalDistance > 0 ? cumulativeDistance / totalDistance : i / coords.length;
    const elapsed = fraction * totalTime;
    timestamps.push(new Date(startTime.getTime() + elapsed));
  }

  return timestamps;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function generateGpx(path: RoutePath, options: GpxOptions = {}): string {
  const { name = "Route", description, startTime } = options;
  const coords = path.points.coordinates;

  const timestamps = startTime ? estimateTimestamps(path, startTime) : null;

  const metadataLines = ["  <metadata>", `    <name>${escapeXml(name)}</name>`];
  if (description) {
    metadataLines.push(`    <desc>${escapeXml(description)}</desc>`);
  }
  metadataLines.push("  </metadata>");

  const trackpoints = coords.map((coord, i) => {
    const [lng, lat, ele] = coord;
    const attrs = `lat="${lat}" lon="${lng}"`;
    const children: string[] = [];
    if (ele !== undefined) {
      children.push(`        <ele>${ele}</ele>`);
    }
    if (timestamps?.[i]) {
      children.push(`        <time>${timestamps[i].toISOString()}</time>`);
    }

    if (children.length === 0) {
      return `      <trkpt ${attrs} />`;
    }

    return [`      <trkpt ${attrs}>`, ...children, "      </trkpt>"].join("\n");
  });

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="route-agent"',
    '  xmlns="http://www.topografix.com/GPX/1/1"',
    '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">',
    ...metadataLines,
    "  <trk>",
    `    <name>${escapeXml(name)}</name>`,
    "    <trkseg>",
    ...trackpoints,
    "    </trkseg>",
    "  </trk>",
    "</gpx>",
  ];

  return `${lines.join("\n")}\n`;
}
