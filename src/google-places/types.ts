export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingCount?: number;
  openNow?: boolean;
  types: string[];
}
