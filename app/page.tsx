"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  MoonStar,
  Navigation,
  Replace,
  Route,
  Sparkles,
  Star,
  Users,
  WandSparkles,
} from "lucide-react";
import { venues, vibeCards } from "@/lib/data";
import { buildRank, buildRoute, walkMinutes } from "@/lib/ranking";
import { Preferences } from "@/lib/types";
import { PrimaryButton, SectionCard } from "@/components/ui";

type Step = 0 | 1 | 2 | 3 | 4 | 5;
type RouteMode = "main" | "cheaper" | "more_party" | "more_social";

type RankedVenue = (typeof venues)[number] & {
  rank: number;
  predictedCrowd: number;
  predictedEnergy: number;
};

type SavedRound = {
  id: string;
  city: Preferences["city"];
  title: string;
  vibes: string[];
  stops: string[];
};

const cityCards = [
  {
    id: "vasteras",
    title: "Västerås",
    subtitle: "Smidig cityrunda med korta avstånd och tydligt barflöde.",
    badge: "Snabb kväll",
  },
  {
    id: "stockholm",
    title: "Stockholm",
    subtitle: "Större kväll med fler vibe-spår, fler områden och större variation.",
    badge: "Större utbud",
  },
] as const;

const cityCenters = {
  vasteras: { lat: 59.6117, lng: 16.5465 },
  stockholm: { lat: 59.3326, lng: 18.0649 },
} as const;

const dnaNames: Record<RouteMode, string> = {
  main: "Signature Night",
  cheaper: "Smart Spend",
  more_party: "Late Peak",
  more_social: "Easy Flow",
};

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div
      className={`rounded-2xl px-3 py-3 text-center text-xs font-bold transition ${
        active
          ? "bg-gradient-to-r from-amber-500 to-red-700 text-white shadow-lg"
          : done
            ? "bg-amber-100 text-amber-900"
            : "border border-amber-100/10 bg-[#231816] text-amber-100/50"
      }`}
    >
      {label}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-amber-100/10 bg-white px-4 py-4 text-sm font-bold text-slate-900 transition hover:opacity-95 active:scale-[0.98]"
    >
      Tillbaka
    </button>
  );
}

function FlowFrame({
  step,
  title,
  subtitle,
  children,
}: {
  step: Step;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <SectionCard>
      <div className="mb-5 grid grid-cols-6 gap-2">
        <StepPill active={step === 0} done={step > 0} label="Start" />
        <StepPill active={step === 1} done={step > 1} label="Stad" />
        <StepPill active={step === 2} done={step > 2} label="Grupp" />
        <StepPill active={step === 3} done={step > 3} label="Vibe" />
        <StepPill active={step === 4} done={step > 4} label="Finjustera" />
        <StepPill active={step === 5} done={false} label="Runda" />
      </div>

      <div className="mb-5">
        <h2 className="text-3xl font-black tracking-tight text-amber-50">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-50/70">{subtitle}</p>
      </div>

      {children}
    </SectionCard>
  );
}

function SliderRow({
  label,
  helper,
  valueLabel,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  helper: string;
  valueLabel: string;
  min: number;
  max: number;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="rounded-3xl border border-amber-100/10 bg-[#231816] p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-amber-50">{label}</div>
          <div className="mt-1 text-xs leading-5 text-amber-100/55">{helper}</div>
        </div>
        <div className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
          {valueLabel}
        </div>
      </div>
      <input
        className="w-full cursor-pointer accent-amber-500 transition active:scale-[1.01]"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function TasteChip({
  active,
  emoji,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  emoji: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[24px] border p-4 text-left transition active:scale-[0.98] ${
        active
          ? "border-transparent bg-gradient-to-br from-amber-700/40 to-red-900/40 shadow-[0_16px_40px_rgba(0,0,0,0.25)]"
          : "border-amber-100/10 bg-[#231816] hover:border-amber-300/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-2xl">{emoji}</div>
        {active ? (
          <div className="rounded-full bg-emerald-400/15 p-1 text-emerald-300">
            <Check size={14} />
          </div>
        ) : null}
      </div>
      <div className="mt-3 text-sm font-extrabold text-amber-50">{title}</div>
      <div className="mt-1 text-xs leading-5 text-amber-100/55">{subtitle}</div>
    </button>
  );
}

function ToggleCard({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-3xl border p-4 text-left transition active:scale-[0.98] ${
        active
          ? "border-transparent bg-gradient-to-br from-emerald-700/25 to-amber-700/20 shadow"
          : "border-amber-100/10 bg-[#231816]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-amber-50">{title}</div>
          <div className="mt-1 text-xs leading-5 text-amber-100/55">{subtitle}</div>
        </div>
        <div className={`h-6 w-11 rounded-full p-1 transition ${active ? "bg-emerald-400/70" : "bg-white/20"}`}>
          <div
            className={`h-4 w-4 rounded-full bg-white transition ${active ? "translate-x-5" : "translate-x-0"}`}
          />
        </div>
      </div>
    </button>
  );
}

function buildEnergyCurve(route: RankedVenue[]) {
  return route.map((stop, index) => {
    const stage =
      index === 0
        ? "Start"
        : index === route.length - 1
          ? "Final"
          : index >= Math.floor(route.length / 2)
            ? "Peak build"
            : "Warm-up";

    return {
      label: stage,
      energy: stop.predictedEnergy,
      name: stop.name,
    };
  });
}

function buildRouteSummary(
  route: RankedVenue[],
  mode: RouteMode,
  cityLabel: string,
  crowdLabel: string,
  priceLabel: string
) {
  const first = route[0];
  const last = route[route.length - 1];

  const modeText = {
    main: "byggd för att kännas komplett från första stopp till sista",
    cheaper: "nedskalad i pris men fortfarande med rätt kvällskänsla",
    more_party: "byggd för att växla upp tydligare mot slutet",
    more_social: "mjukare, mer pratvänlig och enklare att röra sig genom",
  }[mode];

  return `${cityLabel} med ${priceLabel} ton, ${crowdLabel} puls och en kvällsbåge som börjar i ${
    first?.name ?? "första stoppet"
  } och landar i ${last?.name ?? "sista stoppet"}. Den här versionen är ${modeText}.`;
}

function getGoogleMapsDirectionsLink(route: RankedVenue[]) {
  if (!route.length) return "https://maps.google.com";
  return `https://www.google.com/maps/dir/${route.map((p) => `${p.lat},${p.lng}`).join("/")}`;
}

function whyNow(routeLength: number, index: number) {
  if (index === 0) return "Bra första stopp för att landa rätt i kvällen utan att börja för hårt.";
  if (index === routeLength - 1) return "Valt som final för att ge tydlig avslutning och högst kvällskänsla.";
  return "Ligger här för att hålla rytmen uppe mellan socialt flyt och nästa energiskifte.";
}

function whatYouGet(place: RankedVenue) {
  if (place.fit.includes("party")) return "Mer puls, högre energi och tydligare sen-kvällskänsla.";
  if (place.fit.includes("cocktails")) return "Mer miljö, snyggare servering och mer genomtänkt drinkkänsla.";
  if (place.fit.includes("beer")) return "Enklare beslut, lägre tröskel och mer avslappnad pubton.";
  return "Ett stopp som håller ihop gruppen och gör kvällen enkel att fortsätta i.";
}

function EnergyCurve({ route }: { route: RankedVenue[] }) {
  const curve = buildEnergyCurve(route);
  if (!curve.length) return null;

  return (
    <div className="rounded-[28px] border border-amber-100/10 bg-[#231816] p-5">
      <div className="text-xs font-bold uppercase tracking-wide text-amber-300/70">Kvälls-DNA</div>
      <div className="mt-2 text-xl font-black text-amber-50">Energin genom kvällen</div>

      <div className="mt-4 flex items-end gap-3 overflow-x-auto pb-1">
        {curve.map((item, index) => (
          <div key={`${item.name}-${index}`} className="min-w-[78px] flex-1">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-amber-100/45">
              {item.label}
            </div>
            <div className="flex h-28 items-end rounded-2xl bg-black/10 p-2">
              <div
                className="w-full rounded-xl bg-gradient-to-t from-red-800 via-amber-600 to-amber-300"
                style={{ height: `${Math.max(20, item.energy)}%` }}
              />
            </div>
            <div className="mt-2 text-xs font-bold text-amber-50">{item.name}</div>
            <div className="text-[11px] text-amber-100/50">{item.energy}/100</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RouteMap({ route, city }: { route: RankedVenue[]; city: Preferences["city"] }) {
  const width = 720;
  const height = 420;
  const center = cityCenters[city];

  const pointsSource = route.length
    ? route
    : ([{ ...center, id: "center", name: city, area: city, lat: center.lat, lng: center.lng }] as RankedVenue[]);

  const lats = pointsSource.map((p) => p.lat);
  const lngs = pointsSource.map((p) => p.lng);
  const minLat = Math.min(...lats) - 0.01;
  const maxLat = Math.max(...lats) + 0.01;
  const minLng = Math.min(...lngs) - 0.015;
  const maxLng = Math.max(...lngs) + 0.015;

  const project = (lat: number, lng: number) => ({
    x: 28 + ((lng - minLng) / (maxLng - minLng || 1)) * (width - 56),
    y: 34 + (1 - (lat - minLat) / (maxLat - minLat || 1)) * (height - 68),
  });

  const points = pointsSource.map((p) => ({ ...p, ...project(p.lat, p.lng) }));

  return (
    <div className="overflow-hidden rounded-[30px] border border-amber-100/10 bg-[linear-gradient(180deg,#251710_0%,#3b2418_100%)] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-amber-300/70">Integrerad karta</div>
          <div className="mt-1 text-sm font-extrabold text-amber-50">
            Kvällens väg genom {city === "vasteras" ? "Västerås" : "Stockholm"}
          </div>
        </div>
        <a
          href={getGoogleMapsDirectionsLink(route)}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-amber-100/10 bg-black/10 px-3 py-2 text-xs font-bold text-amber-200 transition active:scale-[0.98]"
        >
          Öppna i Maps
        </a>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-[24px] bg-[#1d1411]">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {[70, 130, 190, 250, 310, 370].map((y) => (
          <line key={y} x1="0" y1={y} x2={width} y2={y} stroke="#523326" strokeWidth="1" />
        ))}
        {[90, 180, 270, 360, 450, 540, 630].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2={height} stroke="#523326" strokeWidth="1" />
        ))}

        {route.length > 1 ? (
          <>
            <polyline
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="12"
              opacity="0.14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : null}

        {points.map((p, index) => (
          <g key={p.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r="16"
              fill="#fff7ed"
              stroke={index === 0 ? "#10b981" : index === points.length - 1 ? "#ef4444" : "#f59e0b"}
              strokeWidth="4"
            />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="10" fontWeight="800" fill="#0f172a">
              {index + 1}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl bg-black/10 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-amber-300/70">Flyt</div>
          <div className="mt-1 text-sm font-extrabold text-amber-50">
            {route.length > 3 ? "Kvällsbåge" : "Kompakt runda"}
          </div>
        </div>
        <div className="rounded-2xl bg-black/10 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-amber-300/70">Navigation</div>
          <div className="mt-1 text-sm font-extrabold text-amber-50">Punkt till punkt</div>
        </div>
        <div className="rounded-2xl bg-black/10 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-amber-300/70">Känsla</div>
          <div className="mt-1 text-sm font-extrabold text-amber-50">Byggd för mobil</div>
        </div>
      </div>
    </div>
  );
}

function SavedRoundCard({
  round,
  onLoad,
  onMirror,
}: {
  round: SavedRound;
  onLoad: () => void;
  onMirror: () => void;
}) {
  return (
    <div className="rounded-3xl border border-amber-100/10 bg-[#231816] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-amber-50">{round.title}</div>
          <div className="mt-1 text-xs text-amber-100/55">
            {round.city === "vasteras" ? "Västerås" : "Stockholm"} · {round.vibes.join(" + ")}
          </div>
        </div>
        <div className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-200">
          {round.stops.length} stopp
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onLoad}
          className="flex-1 rounded-2xl bg-black/10 px-3 py-3 text-sm font-bold text-amber-50 transition active:scale-[0.98]"
        >
          Ladda
        </button>
        <button
          onClick={onMirror}
          className="flex-1 rounded-2xl bg-gradient-to-r from-amber-700/25 to-red-900/25 px-3 py-3 text-sm font-bold text-amber-100 transition active:scale-[0.98]"
        >
          Spegla
        </button>
      </div>
    </div>
  );
}

function RouteCard({
  place,
  index,
  routeLength,
  nextPlace,
  onSwap,
  alternatives,
  onFavorite,
  isFavorite,
}: {
  place: RankedVenue;
  index: number;
  routeLength: number;
  nextPlace?: RankedVenue;
  onSwap: (next: RankedVenue) => void;
  alternatives: RankedVenue[];
  onFavorite: () => void;
  isFavorite: boolean;
}) {
  return (
    <div className="rounded-[28px] border border-amber-100/10 bg-[#16110f]/95 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.24)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-amber-300/70">Stopp {index + 1}</div>
          <div className="mt-1 text-2xl font-black text-amber-50">{place.name}</div>
          <div className="mt-1 text-sm text-amber-100/60">
            {place.type} · {place.area}
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-700/30 to-red-900/30 px-3 py-2 text-right">
          <div className="text-[11px] font-bold text-amber-100/60">Match</div>
          <div className="text-lg font-black text-amber-200">{place.rank}/100</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-[#231816] p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-amber-100/50">Öl</div>
          <div className="mt-1 text-sm font-extrabold text-amber-50">{place.beer} kr</div>
        </div>
        <div className="rounded-2xl bg-[#231816] p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-amber-100/50">Drink</div>
          <div className="mt-1 text-sm font-extrabold text-amber-50">{place.drink} kr</div>
        </div>
        <div className="rounded-2xl bg-[#231816] p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-amber-100/50">Crowd</div>
          <div className="mt-1 text-sm font-extrabold text-amber-50">{place.predictedCrowd}/100</div>
        </div>
        <div className="rounded-2xl bg-[#231816] p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-amber-100/50">Energi</div>
          <div className="mt-1 text-sm font-extrabold text-amber-50">{place.predictedEnergy}/100</div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm leading-6 text-amber-50/80">
        <div>
          <span className="font-bold text-amber-50">Inredning:</span> {place.interior}
        </div>
        <div>
          <span className="font-bold text-amber-50">Känsla:</span> {place.note}
        </div>
        <div>
          <span className="font-bold text-amber-50">Varför den valdes:</span> {place.review}
        </div>
        <div>
          <span className="font-bold text-amber-50">Varför nu:</span> {whyNow(routeLength, index)}
        </div>
        <div>
          <span className="font-bold text-amber-50">Vad du får här:</span> {whatYouGet(place)}
        </div>
        {nextPlace ? (
          <div>
            <span className="font-bold text-amber-50">Sedan:</span> cirka {walkMinutes(place, nextPlace)} min promenad
            till {nextPlace.name}.
          </div>
        ) : (
          <div>
            <span className="font-bold text-amber-50">Final:</span> sista stoppet där kvällen ska landa starkt.
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={place.imageUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-amber-100/10 bg-[#231816] px-3 py-2 text-xs font-bold text-amber-200 transition active:scale-[0.98]"
        >
          Bilder
        </a>
        <a
          href={place.reviewUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-amber-100/10 bg-[#231816] px-3 py-2 text-xs font-bold text-amber-200 transition active:scale-[0.98]"
        >
          Recensioner
        </a>
        <button
          onClick={onFavorite}
          className={`rounded-full px-3 py-2 text-xs font-bold transition active:scale-[0.98] ${
            isFavorite ? "bg-amber-500/20 text-amber-200" : "border border-amber-100/10 bg-[#231816] text-amber-100"
          }`}
        >
          <Heart className="mr-1 inline-block" size={12} /> {isFavorite ? "Favorit" : "Spara stopp"}
        </button>
      </div>

      {alternatives.length > 0 ? (
        <div className="mt-5 rounded-3xl border border-amber-100/10 bg-[#231816] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-amber-50">
            <Replace size={16} />
            Byt ut stoppet om kvällen känns lite fel
          </div>
          <div className="grid gap-2">
            {alternatives.map((alt) => (
              <button
                key={alt.id}
                onClick={() => onSwap(alt)}
                className="rounded-2xl bg-black/10 px-3 py-3 text-left transition active:scale-[0.98] hover:bg-black/20"
              >
                <div className="text-sm font-bold text-amber-50">{alt.name}</div>
                <div className="mt-1 text-xs text-amber-100/55">
                  {alt.type} · {alt.area} · match {alt.rank}/100
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const [step, setStep] = useState<Step>(0);
  const [prefs, setPrefs] = useState<Preferences>({
    city: "vasteras",
    vibes: ["social", "cocktails"],
    group: 4,
    youngest: 20,
    start: "19:00",
    stops: 5,
    price: 3,
    crowd: 65,
    walkable: true,
    mirrorMode: false,
  });

  const [routeOverrides, setRouteOverrides] = useState<Record<number, RankedVenue>>({});
  const [favoriteVenueIds, setFavoriteVenueIds] = useState<string[]>([]);
  const [savedRounds, setSavedRounds] = useState<SavedRound[]>([]);
  const [routeMode, setRouteMode] = useState<RouteMode>("main");

  const ranked = useMemo(() => {
    return venues
      .filter((v) => v.city === prefs.city)
      .map((v) => buildRank(v, prefs))
      .filter((v) => v.age <= prefs.youngest)
      .sort((a, b) => b.rank - a.rank) as RankedVenue[];
  }, [prefs]);

  const modeRanked = useMemo(() => {
    return [...ranked].sort((a, b) => {
      const modeScore = (item: RankedVenue) => {
        if (routeMode === "cheaper") return item.rank - item.price * 8 - item.beer * 0.1;
        if (routeMode === "more_party") return item.rank + item.predictedEnergy * 0.45 + item.predictedCrowd * 0.2;
        if (routeMode === "more_social") {
          return (
            item.rank +
            (item.fit.includes("social") ? 18 : 0) +
            (item.fit.includes("casual") ? 10 : 0) -
            item.predictedCrowd * 0.08
          );
        }
        return item.rank;
      };

      return modeScore(b) - modeScore(a);
    });
  }, [ranked, routeMode]);

  const baseRoute = useMemo(
    () => buildRoute(modeRanked.slice(0, prefs.stops)) as RankedVenue[],
    [modeRanked, prefs.stops]
  );

  const route = useMemo(
    () => baseRoute.map((item, index) => routeOverrides[index] ?? item),
    [baseRoute, routeOverrides]
  );

  const totalWalk = useMemo(
    () => route.reduce((sum, r, i) => sum + (route[i + 1] ? walkMinutes(r, route[i + 1]) : 0), 0),
    [route]
  );

  const cityLabel = prefs.city === "vasteras" ? "Västerås" : "Stockholm";
  const crowdLabel = prefs.crowd < 50 ? "lugnare puls" : prefs.crowd < 75 ? "lagom drag" : "mycket energi";
  const priceLabel = ["-", "budgetvänlig", "balanserad", "lite snyggare", "premium"][prefs.price];
  const routeSummary = buildRouteSummary(route, routeMode, cityLabel, crowdLabel, priceLabel);

  const groupBalance = Math.max(
    58,
    Math.min(
      98,
      70 +
        (prefs.vibes.includes("social") ? 8 : 0) +
        (prefs.group <= 6 ? 8 : 0) +
        (prefs.walkable ? 6 : 0) -
        (prefs.price === 4 ? 4 : 0)
    )
  );

  const toggleVibe = (id: string) => {
    setPrefs((prev) => ({
      ...prev,
      vibes: prev.vibes.includes(id) ? prev.vibes.filter((v) => v !== id) : [...prev.vibes, id],
    }));
  };

  const getAlternatives = (currentId: string) => {
    const used = new Set(route.map((r) => r.id));
    return ranked.filter((candidate) => !used.has(candidate.id) && candidate.id !== currentId).slice(0, 3);
  };

  const applySwap = (index: number, nextVenue: RankedVenue) => {
    setRouteOverrides((prev) => ({ ...prev, [index]: nextVenue }));
  };

  const toggleFavorite = (venueId: string) => {
    setFavoriteVenueIds((prev) =>
      prev.includes(venueId) ? prev.filter((id) => id !== venueId) : [...prev, venueId]
    );
  };

  const saveCurrentRound = () => {
    const title = `${cityLabel} · ${prefs.vibes.join(" + ")}`;
    const newRound: SavedRound = {
      id: `${prefs.city}-${Date.now()}`,
      city: prefs.city,
      title,
      vibes: prefs.vibes,
      stops: route.map((r) => r.id),
    };

    setSavedRounds((prev) =>
      [newRound, ...prev.filter((item) => item.title !== newRound.title || item.city !== newRound.city)].slice(0, 6)
    );
  };

  const loadSavedRound = (round: SavedRound) => {
    setPrefs((prev) => ({
      ...prev,
      city: round.city,
      vibes: round.vibes,
      stops: Math.max(2, round.stops.length),
    }));

    const cityRanked = venues
      .filter((v) => v.city === round.city)
      .map((v) => buildRank(v, { ...prefs, city: round.city, vibes: round.vibes }));

    const overrideMap: Record<number, RankedVenue> = {};

    round.stops.forEach((id, index) => {
      const found = cityRanked.find((v) => v.id === id) as RankedVenue | undefined;
      if (found) overrideMap[index] = found;
    });

    setRouteOverrides(overrideMap);
    setRouteMode("main");
    setStep(5);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const mirrorSavedRound = (round: SavedRound) => {
    const targetCity = round.city === "vasteras" ? "stockholm" : "vasteras";
    const sourceStops = round.stops
      .map((id) => venues.find((v) => v.id === id))
      .filter(Boolean) as (typeof venues)[number][];

    const targetPool = venues
      .filter((v) => v.city === targetCity)
      .map((v) => buildRank(v, { ...prefs, city: targetCity, vibes: round.vibes }));

    const selected: RankedVenue[] = [];
    const used = new Set<string>();

    sourceStops.forEach((source) => {
      const best = targetPool
        .filter((candidate) => !used.has(candidate.id))
        .sort((a, b) => {
          const overlapA = source.fit.filter((f) => a.fit.includes(f)).length * 20;
          const overlapB = source.fit.filter((f) => b.fit.includes(f)).length * 20;
          const priceA = 100 - Math.abs(source.price - a.price) * 18;
          const priceB = 100 - Math.abs(source.price - b.price) * 18;
          return overlapB + priceB - (overlapA + priceA);
        })[0] as RankedVenue | undefined;

      if (best) {
        used.add(best.id);
        selected.push(best);
      }
    });

    const overrideMap: Record<number, RankedVenue> = {};
    selected.forEach((item, index) => {
      overrideMap[index] = item;
    });

    setPrefs((prev) => ({
      ...prev,
      city: targetCity,
      vibes: round.vibes,
      stops: Math.max(2, selected.length || prev.stops),
    }));

    setRouteOverrides(overrideMap);
    setRouteMode("main");
    setStep(5);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="mx-auto max-w-6xl p-3 pb-10 md:p-6">
      <div className="mb-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard>
          <div className="mb-4 inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
            Link&Drink · launch flow v3
          </div>
          <h1 className="max-w-2xl text-4xl font-black tracking-tight text-amber-50 md:text-5xl">
            Gör kvällen enkel att välja — och svår att glömma.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-amber-50/72 md:text-base">
            Link&Drink ska kännas som att kvällen redan är löst. Du väljer stad, grupp och känsla — appen bygger resten.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-[#231816] px-3 py-2 text-amber-100">Vibe först</span>
            <span className="rounded-full bg-[#231816] px-3 py-2 text-amber-100">Mobil-först</span>
            <span className="rounded-full bg-[#231816] px-3 py-2 text-amber-100">Kuraterad kväll</span>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="text-sm font-bold uppercase tracking-wide text-amber-300/70">Live preview</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-3xl bg-[#231816] p-4">
              <div className="flex items-center gap-2 text-amber-300">
                <MapPin size={16} />
                <div className="text-xs font-bold uppercase tracking-wide">Stad</div>
              </div>
              <div className="mt-2 text-xl font-black text-amber-50">{cityLabel}</div>
              <div className="mt-1 text-sm text-amber-100/60">
                {prefs.city === "vasteras" ? "Tät cityrunda" : "Större val och fler områden"}
              </div>
            </div>

            <div className="rounded-3xl bg-[#231816] p-4">
              <div className="flex items-center gap-2 text-amber-300">
                <Users size={16} />
                <div className="text-xs font-bold uppercase tracking-wide">Grupp</div>
              </div>
              <div className="mt-2 text-xl font-black text-amber-50">{prefs.group} personer</div>
              <div className="mt-1 text-sm text-amber-100/60">Yngsta: {prefs.youngest} år</div>
            </div>

            <div className="rounded-3xl bg-[#231816] p-4 sm:col-span-2 xl:col-span-1">
              <div className="flex items-center gap-2 text-amber-300">
                <MoonStar size={16} />
                <div className="text-xs font-bold uppercase tracking-wide">Kvällskänsla</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {prefs.vibes.map((v) => (
                  <span key={v} className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-200">
                    {v}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-sm text-amber-100/60">
                {route.length} stopp · ca {totalWalk} min gångtid
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {step === 0 && (
        <FlowFrame
          step={0}
          title="Starta en kväll som faktiskt känns genomtänkt"
          subtitle="Ingen stressig lista. Bara ett tydligt flöde där vi först fattar stad, grupp och vibe — sedan bygger vi en kväll som känns rätt direkt."
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
            <div className="rounded-[28px] border border-amber-100/10 bg-[#231816] p-5">
              <div className="text-sm font-black text-amber-50">Vad du får</div>
              <div className="mt-4 grid gap-3">
                {[
                  "En barrunda som väljer känsla före brus.",
                  "Ställen som passar gruppen, inte bara en lista.",
                  "En kväll som går att justera utan att börja om.",
                ].map((line) => (
                  <div key={line} className="flex items-start gap-3 rounded-2xl bg-black/10 p-3 text-sm text-amber-50/80">
                    <div className="mt-0.5 rounded-full bg-amber-500/15 p-1 text-amber-300">
                      <Check size={14} />
                    </div>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-amber-100/10 bg-gradient-to-br from-amber-700/25 to-red-900/25 p-5">
              <div className="text-xs font-bold uppercase tracking-wide text-amber-300/70">För kunden</div>
              <div className="mt-2 text-2xl font-black text-amber-50">Hitta rätt kväll snabbare</div>
              <p className="mt-3 text-sm leading-6 text-amber-50/70">
                Välj stad, grupp och känsla. Få sedan en barrunda med stopp, timing, förklaringar och alternativ om något
                känns fel.
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <PrimaryButton className="max-w-xs" onClick={() => setStep(1)}>
              Starta kvällsplaneringen <ArrowRight className="ml-2 inline-block" size={16} />
            </PrimaryButton>
          </div>
        </FlowFrame>
      )}

      {step === 1 && (
        <FlowFrame
          step={1}
          title="Välj stad för kvällens tempo"
          subtitle="Staden påverkar inte bara vilka ställen som finns, utan vilken typ av kväll appen bygger åt dig."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {cityCards.map((cityCard) => {
              const active = prefs.city === cityCard.id;
              return (
                <button
                  key={cityCard.id}
                  onClick={() => setPrefs((prev) => ({ ...prev, city: cityCard.id }))}
                  className={`rounded-[26px] border p-5 text-left transition active:scale-[0.98] ${
                    active
                      ? "border-transparent bg-gradient-to-br from-amber-700/40 to-red-900/40 shadow-[0_16px_40px_rgba(0,0,0,0.25)]"
                      : "border-amber-100/10 bg-[#231816] hover:border-amber-300/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xl font-black text-amber-50">{cityCard.title}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-wide text-amber-300/70">
                        {cityCard.badge}
                      </div>
                    </div>
                    {active ? (
                      <div className="rounded-full bg-emerald-400/15 p-1 text-emerald-300">
                        <Check size={14} />
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-amber-50/68">{cityCard.subtitle}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <BackButton onClick={() => setStep(0)} />
            <PrimaryButton className="max-w-xs" onClick={() => setStep(2)}>
              Fortsätt till grupp <ChevronRight className="ml-2 inline-block" size={16} />
            </PrimaryButton>
          </div>
        </FlowFrame>
      )}

      {step === 2 && (
        <FlowFrame
          step={2}
          title="Sätt ramarna för sällskapet"
          subtitle="Hur många ni är och hur ung gruppen är påverkar vad som är realistiskt, smidigt och faktiskt roligt att få upp som förslag."
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="space-y-4">
              <SliderRow
                label="Antal personer"
                helper="Styr hur lätt rundan ska flyta mellan stoppen och hur gruppvänliga alternativen behöver vara."
                valueLabel={`${prefs.group} pers`}
                min={2}
                max={12}
                value={prefs.group}
                onChange={(next) => setPrefs((prev) => ({ ...prev, group: next }))}
              />
              <SliderRow
                label="Yngsta i gruppen"
                helper="Allt med högre åldersgräns filtreras bort direkt så att rundan känns användbar på riktigt."
                valueLabel={`${prefs.youngest} år`}
                min={18}
                max={25}
                value={prefs.youngest}
                onChange={(next) => setPrefs((prev) => ({ ...prev, youngest: next }))}
              />
            </div>

            <div className="rounded-[28px] border border-amber-100/10 bg-[#231816] p-5">
              <div className="text-xs font-bold uppercase tracking-wide text-amber-300/70">Så tolkar appen läget</div>
              <div className="mt-3 space-y-3 text-sm leading-6 text-amber-50/75">
                <div>
                  <span className="font-bold text-amber-50">Nuvarande grupp:</span> {prefs.group} personer.{" "}
                  {prefs.group >= 8
                    ? "Appen prioriterar enklare, mindre friktionsfyllda stopp för grupp."
                    : "Appen kan välja mer precisa och känsliga vibe-stopp utan att det känns trångt."}
                </div>
                <div>
                  <span className="font-bold text-amber-50">Åldersfilter:</span> {prefs.youngest}+ i gruppen betyder att
                  bara realistiska ställen kommer med.
                </div>
                <div>
                  <span className="font-bold text-amber-50">Resultat just nu:</span> {ranked.length} möjliga ställen
                  matchar innan slutlig vibe-filtrering.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <BackButton onClick={() => setStep(1)} />
            <PrimaryButton className="max-w-xs" onClick={() => setStep(3)}>
              Fortsätt till vibe <ChevronRight className="ml-2 inline-block" size={16} />
            </PrimaryButton>
          </div>
        </FlowFrame>
      )}

      {step === 3 && (
        <FlowFrame
          step={3}
          title="Välj hur kvällen ska kännas"
          subtitle="Viben styr vilka stopp som känns rätt, hur rundan byggs och hur kvällen upplevs som helhet."
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {vibeCards.map((v) => {
                const subtitles: Record<string, string> = {
                  social: "För kvällar där snacket och känslan mellan stoppen är viktigast.",
                  cocktails: "För snyggare drinkstopp där miljö och känsla ska bära kvällen.",
                  party: "För när rundan ska växla upp mot riktig utgångskänsla.",
                  beer: "För enklare, jordnära och mer pubdriven kväll.",
                  date: "För lite snyggare tempo, bättre miljö och mer medvetna stopp.",
                  casual: "För låg tröskel, avslappnad rytm och mindre pressad kväll.",
                };

                return (
                  <TasteChip
                    key={v.id}
                    active={prefs.vibes.includes(v.id)}
                    emoji={v.emoji}
                    title={v.title}
                    subtitle={subtitles[v.id]}
                    onClick={() => toggleVibe(v.id)}
                  />
                );
              })}
            </div>

            <div className="rounded-[28px] border border-amber-100/10 bg-[#231816] p-5">
              <div className="text-xs font-bold uppercase tracking-wide text-amber-300/70">Kvällsbild just nu</div>
              <div className="mt-3 text-2xl font-black text-amber-50">
                {prefs.vibes.length ? prefs.vibes.join(" + ") : "Ingen vibe vald ännu"}
              </div>
              <p className="mt-3 text-sm leading-6 text-amber-50/70">
                Appen bygger en kväll som ska kännas sammanhängande, inte bara korrekt.
              </p>
              <div className="mt-4 rounded-3xl bg-black/10 p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-amber-300/70">Om du genererar nu</div>
                <div className="mt-2 text-sm text-amber-50/80">
                  {route.length} stopp · {cityLabel} · ca {totalWalk} min gångtid
                </div>
                <div className="mt-2 text-sm text-amber-100/60">
                  Högst rankade första stopp: <span className="font-bold text-amber-50">{route[0]?.name ?? "Inget än"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <BackButton onClick={() => setStep(2)} />
            <PrimaryButton className="max-w-xs" onClick={() => setStep(4)}>
              Nästa: finjustera kvällen <ChevronRight className="ml-2 inline-block" size={16} />
            </PrimaryButton>
          </div>
        </FlowFrame>
      )}

      {step === 4 && (
        <FlowFrame
          step={4}
          title="Finjustera kvällen innan vi bygger den"
          subtitle="Här styr du hur dyr, tät, lång och energifylld kvällen ska bli — utan att tappa flödet."
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <SliderRow
                  label="Prisnivå"
                  helper="Budgetsmart, balanserad eller mer premium i tonen."
                  valueLabel={priceLabel}
                  min={1}
                  max={4}
                  value={prefs.price}
                  onChange={(next) => setPrefs((prev) => ({ ...prev, price: next }))}
                />
                <SliderRow
                  label="Hur mycket folk?"
                  helper="Luft, lagom puls eller kväll där det redan känns laddat."
                  valueLabel={crowdLabel}
                  min={40}
                  max={90}
                  value={prefs.crowd}
                  onChange={(next) => setPrefs((prev) => ({ ...prev, crowd: next }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SliderRow
                  label="Antal stopp"
                  helper="Kort runda eller längre kväll med fler skiften."
                  valueLabel={`${prefs.stops} stopp`}
                  min={2}
                  max={10}
                  value={prefs.stops}
                  onChange={(next) => setPrefs((prev) => ({ ...prev, stops: next }))}
                />
                <div className="rounded-3xl border border-amber-100/10 bg-[#231816] p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-amber-50">Starttid</div>
                      <div className="mt-1 text-xs leading-5 text-amber-100/55">
                        Tiden påverkar crowd- och energibedömning.
                      </div>
                    </div>
                    <div className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
                      {prefs.start}
                    </div>
                  </div>
                  <input
                    type="time"
                    value={prefs.start}
                    onChange={(e) => setPrefs((prev) => ({ ...prev, start: e.target.value }))}
                    className="w-full rounded-2xl border border-amber-100/10 bg-black/10 px-4 py-3 text-sm font-bold text-amber-50"
                  />
                </div>
              </div>

              <ToggleCard
                active={prefs.walkable}
                title="Promenadvänlig runda"
                subtitle="Prioritera kortare avstånd och mindre logistiskt brus."
                onClick={() => setPrefs((prev) => ({ ...prev, walkable: !prev.walkable }))}
              />
            </div>

            <div className="rounded-[28px] border border-amber-100/10 bg-[#231816] p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-300/70">
                <Sparkles size={14} />
                Så här kommer kvällen kännas
              </div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-amber-50/78">
                <div>
                  <span className="font-bold text-amber-50">Ton:</span> {priceLabel}, {crowdLabel} och{" "}
                  {prefs.walkable ? "smidigt gångbar" : "mindre låst till avstånd"}.
                </div>
                <div>
                  <span className="font-bold text-amber-50">Rytm:</span>{" "}
                  {prefs.stops <= 3
                    ? "kortare och skarpare"
                    : prefs.stops <= 6
                      ? "balanserad med tydlig kvällsbåge"
                      : "längre kväll med fler skiften och större variation"}
                  .
                </div>
                <div>
                  <span className="font-bold text-amber-50">Nuvarande toppspår:</span>{" "}
                  <span className="font-bold text-amber-50">{route[0]?.name ?? "—"}</span>.
                </div>
                <div>
                  <span className="font-bold text-amber-50">Helhet:</span> en kväll som ska kännas planerad, inte slumpad.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <BackButton onClick={() => setStep(3)} />
            <PrimaryButton className="max-w-xs" onClick={() => setStep(5)}>
              Generera min barrunda <WandSparkles className="ml-2 inline-block" size={16} />
            </PrimaryButton>
          </div>
        </FlowFrame>
      )}

      {step === 5 && (
        <FlowFrame
          step={5}
          title="Här är kvällens barrunda"
          subtitle="En användbar barrunda med tydlig kvällsbåge, prisbild, känsla och alternativ om något känns fel."
        >
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <div className="rounded-[28px] border border-amber-100/10 bg-[#231816] p-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-300/70">
                  <Sparkles size={14} />
                  AI-sammanfattning
                </div>
                <div className="mt-3 text-2xl font-black text-amber-50">
                  {cityLabel} · {prefs.vibes.join(" + ")}
                </div>
                <p className="mt-3 text-sm leading-6 text-amber-50/75">
                  Den här kvällen är {priceLabel}, {crowdLabel} och{" "}
                  {prefs.walkable ? "smidig att röra sig genom" : "friare i sin geografi"}.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-black/10 p-3">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Clock3 size={14} />
                      <span className="text-[11px] font-bold uppercase tracking-wide">Gångtid</span>
                    </div>
                    <div className="mt-2 text-lg font-black text-amber-50">{totalWalk} min</div>
                  </div>
                  <div className="rounded-2xl bg-black/10 p-3">
                    <div className="flex items-center gap-2 text-amber-300">
                      <MapPin size={14} />
                      <span className="text-[11px] font-bold uppercase tracking-wide">Stopp</span>
                    </div>
                    <div className="mt-2 text-lg font-black text-amber-50">{route.length}</div>
                  </div>
                  <div className="rounded-2xl bg-black/10 p-3">
                    <div className="flex items-center gap-2 text-amber-300">
                      <MoonStar size={14} />
                      <span className="text-[11px] font-bold uppercase tracking-wide">Start</span>
                    </div>
                    <div className="mt-2 text-lg font-black text-amber-50">{prefs.start}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={saveCurrentRound}
                    className="rounded-full bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-200 transition active:scale-[0.98]"
                  >
                    <Star className="mr-1 inline-block" size={12} /> Spara rundan
                  </button>
                  <a
                    href={getGoogleMapsDirectionsLink(route)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-amber-100/10 bg-black/10 px-3 py-2 text-xs font-bold text-amber-200 transition active:scale-[0.98]"
                  >
                    <Navigation className="mr-1 inline-block" size={12} /> Öppna navigation
                  </a>
                </div>
              </div>

              <div className="rounded-[28px] border border-amber-100/10 bg-[#231816] p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-amber-300/70">Kvälls-DNA</div>
                <div className="mt-2 text-2xl font-black text-amber-50">{dnaNames[routeMode]}</div>
                <p className="mt-3 text-sm leading-6 text-amber-50/75">{routeSummary}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-black/10 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-amber-300/70">Gruppbalans</div>
                    <div className="mt-1 text-lg font-black text-amber-50">{groupBalance}%</div>
                    <div className="text-xs text-amber-100/50">Hur väl kvällens upplägg passar gruppen.</div>
                  </div>
                  <div className="rounded-2xl bg-black/10 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-amber-300/70">Rundläge</div>
                    <div className="mt-1 text-lg font-black text-amber-50">
                      {routeMode === "main"
                        ? "Original"
                        : routeMode === "cheaper"
                          ? "Billigare"
                          : routeMode === "more_party"
                            ? "Mer party"
                            : "Mer social"}
                    </div>
                    <div className="text-xs text-amber-100/50">Byt version utan att börja om.</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => setRouteMode("main")}
                    className={`rounded-2xl px-3 py-3 text-sm font-bold transition active:scale-[0.98] ${
                      routeMode === "main"
                        ? "bg-gradient-to-r from-amber-600 to-red-800 text-white"
                        : "bg-black/10 text-amber-100"
                    }`}
                  >
                    Originalrundan
                  </button>
                  <button
                    onClick={() => setRouteMode("cheaper")}
                    className={`rounded-2xl px-3 py-3 text-sm font-bold transition active:scale-[0.98] ${
                      routeMode === "cheaper"
                        ? "bg-gradient-to-r from-amber-600 to-red-800 text-white"
                        : "bg-black/10 text-amber-100"
                    }`}
                  >
                    Plan B: billigare
                  </button>
                  <button
                    onClick={() => setRouteMode("more_party")}
                    className={`rounded-2xl px-3 py-3 text-sm font-bold transition active:scale-[0.98] ${
                      routeMode === "more_party"
                        ? "bg-gradient-to-r from-amber-600 to-red-800 text-white"
                        : "bg-black/10 text-amber-100"
                    }`}
                  >
                    Plan B: mer party
                  </button>
                  <button
                    onClick={() => setRouteMode("more_social")}
                    className={`rounded-2xl px-3 py-3 text-sm font-bold transition active:scale-[0.98] ${
                      routeMode === "more_social"
                        ? "bg-gradient-to-r from-amber-600 to-red-800 text-white"
                        : "bg-black/10 text-amber-100"
                    }`}
                  >
                    Plan B: mer social
                  </button>
                </div>
              </div>

              <EnergyCurve route={route} />
              <RouteMap route={route} city={prefs.city} />

              {savedRounds.length > 0 ? (
                <div className="rounded-[28px] border border-amber-100/10 bg-[#231816] p-5">
                  <div className="mb-3 text-sm font-black uppercase tracking-wide text-amber-300/70">Sparade rundor</div>
                  <div className="grid gap-3">
                    {savedRounds.map((round) => (
                      <SavedRoundCard
                        key={round.id}
                        round={round}
                        onLoad={() => loadSavedRound(round)}
                        onMirror={() => mirrorSavedRound(round)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              {route.map((place, index) => (
                <RouteCard
                  key={`${place.id}-${index}`}
                  place={place}
                  index={index}
                  routeLength={route.length}
                  nextPlace={route[index + 1]}
                  onSwap={(nextVenue) => applySwap(index, nextVenue)}
                  alternatives={getAlternatives(place.id)}
                  onFavorite={() => toggleFavorite(place.id)}
                  isFavorite={favoriteVenueIds.includes(place.id)}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <BackButton onClick={() => setStep(4)} />
            <PrimaryButton className="max-w-xs">
              Nästa: login & synk <Route className="ml-2 inline-block" size={16} />
            </PrimaryButton>
          </div>
        </FlowFrame>
      )}
    </main>
  );
}