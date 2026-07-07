import type { BoundingBox, Place } from "./types";

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

// rating and hours push the request past the Places API's cheapest (Essentials) SKU
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.currentOpeningHours.openNow",
  "places.types",
].join(",");

interface PlacesSearchResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  currentOpeningHours?: { openNow?: boolean };
  types?: string[];
}

interface PlacesSearchResponse {
  places?: PlacesSearchResult[];
}

function toRectangle(bounds: BoundingBox) {
  return {
    low: { latitude: bounds.south, longitude: bounds.west },
    high: { latitude: bounds.north, longitude: bounds.east },
  };
}

export async function findPlaces(
  apiKey: string,
  bounds: BoundingBox,
  query: string,
  openNow?: boolean,
): Promise<Place[]> {
  const response = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      locationRestriction: { rectangle: toRectangle(bounds) },
      ...(openNow !== undefined ? { openNow } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Places API error: ${response.status} ${error}`);
  }

  const data = (await response.json()) as PlacesSearchResponse;

  return (data.places ?? []).map((place) => ({
    id: place.id,
    name: place.displayName?.text ?? "",
    address: place.formattedAddress ?? "",
    lat: place.location?.latitude ?? 0,
    lng: place.location?.longitude ?? 0,
    ...(place.rating !== undefined ? { rating: place.rating } : {}),
    ...(place.userRatingCount !== undefined ? { userRatingCount: place.userRatingCount } : {}),
    ...(place.currentOpeningHours?.openNow !== undefined
      ? { openNow: place.currentOpeningHours.openNow }
      : {}),
    types: place.types ?? [],
  }));
}
