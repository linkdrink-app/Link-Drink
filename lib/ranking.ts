import { Preferences, Venue } from "./types";

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function km(a: Venue, b: Venue) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function walkMinutes(a: Venue, b: Venue) {
  return Math.max(3, Math.round(km(a, b) * 12));
}

export function vibeScore(place: Venue, selected: string[]) {
  if (!selected.length) return 70;
  const matches = selected.filter((v) => place.fit.includes(v)).length;
  return 45 + matches * 24;
}

export function shiftCrowd(hour: number) {
  if (hour <= 17) return -14;
  if (hour <= 19) return 0;
  if (hour <= 21) return 10;
  if (hour <= 23) return 18;
  return 10;
}

export function shiftEnergy(hour: number) {
  if (hour <= 17) return -10;
  if (hour <= 19) return -2;
  if (hour <= 21) return 8;
  if (hour <= 23) return 16;
  return 10;
}

export function buildRank(place: Venue, prefs: Preferences) {
  const h = Number(String(prefs.start).split(":")[0] || 19);
  const agePenalty = prefs.youngest < place.age ? 100 : 0;
  const sizePenalty = prefs.group > 8 && (place.type.includes("Hotell") || place.type.includes("Cocktailbar")) ? 8 : 0;
  const score =
    vibeScore(place, prefs.vibes) * 0.3 +
    (100 - Math.abs(place.price - prefs.price) * 24) * 0.16 +
    (100 - Math.abs(place.crowd + shiftCrowd(h) - prefs.crowd)) * 0.16 +
    (place.energy + shiftEnergy(h)) * 0.18 +
    (prefs.walkable ? 90 : 70) * 0.1 +
    ((30 - Math.min(place.beer, 120)) / 30) * 10 -
    agePenalty -
    sizePenalty;

  return {
    ...place,
    rank: Math.round(score),
    predictedCrowd: clamp(place.crowd + shiftCrowd(h), 30, 100),
    predictedEnergy: clamp(place.energy + shiftEnergy(h), 30, 100)
  };
}

export function buildRoute<T extends Venue & { rank: number }>(candidates: T[]) {
  if (!candidates.length) return [] as T[];
  const first = [...candidates].sort((a, b) => b.rank - a.rank)[0];
  const rest = candidates.filter((x) => x.id !== first.id);
  const route = [first];
  while (rest.length) {
    rest.sort((a, b) => km(route[route.length - 1], a) - km(route[route.length - 1], b));
    route.push(rest.shift()!);
  }
  return route;
}