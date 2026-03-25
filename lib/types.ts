export type CityKey = "vasteras" | "stockholm";

export type Venue = {
  id: string;
  name: string;
  type: string;
  area: string;
  city: CityKey;
  lat: number;
  lng: number;
  price: number;
  energy: number;
  crowd: number;
  age: number;
  beer: number;
  drink: number;
  interior: string;
  fit: string[];
  note: string;
  review: string;
  imageUrl: string;
  reviewUrl: string;
};

export type Preferences = {
  city: CityKey;
  vibes: string[];
  group: number;
  youngest: number;
  start: string;
  stops: number;
  price: number;
  crowd: number;
  walkable: boolean;
  mirrorMode: boolean;
};