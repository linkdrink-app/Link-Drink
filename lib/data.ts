import { Venue } from "./types";

export const vibeCards = [
  { id: "social", emoji: "🥂", title: "Socialt" },
  { id: "cocktails", emoji: "🍸", title: "Cocktails" },
  { id: "party", emoji: "🪩", title: "Drag" },
  { id: "beer", emoji: "🍺", title: "Pub/öl" },
  { id: "date", emoji: "✨", title: "Date" },
  { id: "casual", emoji: "🙂", title: "Casual" }
] as const;

export const venues: Venue[] = [
  {
    id: "boca",
    name: "Boca",
    type: "Cocktailbar",
    area: "Centrum",
    city: "vasteras",
    lat: 59.6118,
    lng: 16.5467,
    price: 3,
    energy: 74,
    crowd: 68,
    age: 20,
    beer: 72,
    drink: 138,
    interior: "Mörk lounge",
    fit: ["cocktails", "date", "social"],
    note: "Snygg start eller mittstopp.",
    review: "Cocktailbar/loungeläge med bra service enligt många omdömen.",
    imageUrl: "https://www.bocavasteras.se/",
    reviewUrl: "https://www.tripadvisor.se/Restaurant_Review-g189878-d1054458-Reviews-Boca-Vasteras_Vastmanland_County.html"
  },
  {
    id: "tjoget",
    name: "Tjoget",
    type: "Cocktailbar / kvarterskrog",
    area: "Hornstull",
    city: "stockholm",
    lat: 59.3157,
    lng: 18.0339,
    price: 3,
    energy: 77,
    crowd: 70,
    age: 20,
    beer: 76,
    drink: 158,
    interior: "Stimmig, varm och social",
    fit: ["cocktails", "social", "casual"],
    note: "Bra social cocktailrunda.",
    review: "Prisad bar med avslappnad men kvalitativ vibe.",
    imageUrl: "https://www.tjoget.com/",
    reviewUrl: "https://www.tripadvisor.se/Restaurant_Review-g189852-d21283892-Reviews-Tjoget-Stockholm.html"
  }
];