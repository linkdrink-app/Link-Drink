"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  MoonStar,
  Replace,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";
import { venues, vibeCards } from "@/lib/data";
import { buildRank, buildRoute, walkMinutes } from "@/lib/ranking";
import { Preferences } from "@/lib/types";
import { PrimaryButton, SectionCard } from "@/components/ui";

type Step = 0 | 1 | 2 | 3 | 4 | 5;

type RankedVenue = (typeof venues)[number] & {
  rank: number;
  predictedCrowd: number;
  predictedEnergy: number;
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
        <div className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">{valueLabel}</div>
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
          <div className={`h-4 w-4 rounded-full bg-white transition ${active ? "translate-x-5" : "translate-x-0"}`} />
        </div>
      </div>
    </button>
  );
}

function RouteCard({
  place,
  index,
  nextPlace,
  onSwap,
  alternatives,
}: {
  place: RankedVenue;
  index: number;
  nextPlace?: RankedVenue;
  onSwap: (next: RankedVenue) => void;
  alternatives: RankedVenue[];
}) {
  return (
    <div className="rounded-[28px] border border-amber-100/10 bg-[#16110f]/95 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.24)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-amber-300/70">Stopp {index + 1}</div>
          <div className="mt-1 text-2xl font-black text-amber-50">{place.name}</div>
          <div className="mt-1 text-sm text-amber-100/60">{place.type} · {place.area}</div>
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
        <div><span className="font-bold text-amber-50">Inredning:</span> {place.interior}</div>
        <div><span className="font-bold text-amber-50">Känsla:</span> {place.note}</div>
        <div><span className="font-bold text-amber-50">Varför den valdes:</span> {place.review}</div>
        {nextPlace ? (
          <div><span className="font-bold text-amber-50">Sedan:</span> cirka {walkMinutes(place, nextPlace)} min promenad till {nextPlace.name}.</div>
        ) : (
          <div><span className="font-bold text-amber-50">Final:</span> sista stoppet där kvällen ska landa starkt.</div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a href={place.imageUrl} target="_blank" rel="noreferrer" className="rounded-full border border-amber-100/10 bg-[#231816] px-3 py-2 text-xs font-bold text-amber-200 transition active:scale-[0.98]">Bilder</a>
        <a href={place.reviewUrl} target="_blank" rel="noreferrer" className="rounded-full border border-amber-100/10 bg-[#231816] px-3 py-2 text-xs font-bold text-amber-200 transition active:scale-[0.98]">Recensioner</a>
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
                <div className="mt-1 text-xs text-amber-100/55">{alt.type} · {alt.area} · match {alt.rank}/100</div>
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

  const ranked = useMemo(() => {
    return venues
      .filter((v) => v.city === prefs.city)
      .map((v) => buildRank(v, prefs))
      .filter((v) => v.age <= prefs.youngest)
      .sort((a, b) => b.rank - a.rank) as RankedVenue[];
  }, [prefs]);

  const baseRoute = useMemo(() => buildRoute(ranked.slice(0, prefs.stops)) as RankedVenue[], [ranked, prefs.stops]);
  const route = useMemo(() => baseRoute.map((item, index) => routeOverrides[index] ?? item), [baseRoute, routeOverrides]);
  const totalWalk = useMemo(
    () => route.reduce((sum, r, i) => sum + (route[i + 1] ? walkMinutes(r, route[i + 1]) : 0), 0),
    [route],
  );

  const cityLabel = prefs.city === "vasteras" ? "Västerås" : "Stockholm";
  const crowdLabel = prefs.crowd < 50 ? "lugnare puls" : prefs.crowd < 75 ? "lagom drag" : "mycket energi";
  const priceLabel = ["-", "budgetvänlig", "balanserad", "lite snyggare", "premium"][prefs.price];

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

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="mb-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard>
          <div className="mb-4 inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
            Link&Drink · launch flow v2
          </div>
          <h1 className="max-w-2xl text-4xl font-black tracking-tight text-amber-50 md:text-5xl">
            Gör kvällen enkel att välja — och svår att glömma.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-amber-50/72 md:text-base">
            Link&Drink ska inte kännas som ännu en sökapp. Den ska kännas som en vän som redan fattat vilken typ av kväll ni vill ha — och serverar en barrunda som känns rätt direkt.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-[#231816] px-3 py-2 text-amber-100">Vibe först</span>
            <span className="rounded-full bg-[#231816] px-3 py-2 text-amber-100">Mobil-först</span>
            <span className="rounded-full bg-[#231816] px-3 py-2 text-amber-100">Detta är min kväll-känsla</span>
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
              <div className="mt-1 text-sm text-amber-100/60">{prefs.city === "vasteras" ? "Tät cityrunda" : "Större val och fler områden"}</div>
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
              <div className="mt-3 text-sm text-amber-100/60">{route.length} stopp · ca {totalWalk} min gångtid</div>
            </div>
          </div>
        </SectionCard>
      </div>

      {step === 0 && (
        <FlowFrame
          step={0}
          title="Starta en kväll som faktiskt känns genomtänkt"
          subtitle="Ingen stressig listning av 100 ställen. Bara ett tydligt flöde där vi först fattar stad, grupp och vibe — sedan bygger vi en kväll som känns som din."
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
            <div className="rounded-[28px] border border-amber-100/10 bg-[#231816] p-5">
              <div className="text-sm font-black text-amber-50">Vad du får</div>
              <div className="mt-4 grid gap-3">
                {[
                  "En barrunda som väljer känsla före brus.",
                  "Ställen som passar gruppen, inte bara en snygg lista.",
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
              <div className="text-xs font-bold uppercase tracking-wide text-amber-300/70">Kvällsscenario</div>
              <div className="mt-2 text-2xl font-black text-amber-50">“Vi vill bara att det ska bli rätt direkt.”</div>
              <p className="mt-3 text-sm leading-6 text-amber-50/70">
                Det är exakt vad det här flödet ska kännas som. Inte planerande. Inte jobbigt. Bara smart, snyggt och självklart.
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
          subtitle="Staden påverkar inte bara vilka ställen som finns, utan vilken typ av kväll appen bygger åt dig. Västerås ska kännas snabb och nära. Stockholm ska kännas bredare och mer formbar."
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
                      <div className="mt-1 text-xs font-bold uppercase tracking-wide text-amber-300/70">{cityCard.badge}</div>
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
          subtitle="Här gör appen sin första riktiga bedömning. Hur många ni är och hur ung gruppen är påverkar vad som är realistiskt, smidigt och faktiskt roligt att få upp som förslag."
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
                  <span className="font-bold text-amber-50">Nuvarande grupp:</span> {prefs.group} personer. {prefs.group >= 8 ? "Appen kommer prioritera mindre friktionsfyllda stopp som är enklare att landa i som grupp." : "Appen kan välja mer precisa och känsliga vibe-stopp utan att det känns trångt eller stelt."}
                </div>
                <div>
                  <span className="font-bold text-amber-50">Åldersfilter:</span> {prefs.youngest}+ i gruppen betyder att bara realistiska ställen kommer med från start.
                </div>
                <div>
                  <span className="font-bold text-amber-50">Resultat just nu:</span> {ranked.length} möjliga ställen matchar innan slutlig vibe-filtrering.
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
          subtitle="Det här är inte bara ett filter. Det är appens personlighetsskikt. Viben styr vilka stopp som känns rätt, hur rundan byggs och hur användaren upplever att appen faktiskt förstår kvällen."
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {vibeCards.map((v) => {
                const subtitles: Record<string, string> = {
                  social: "För kvällar där snacket, tempot och känslan mellan stoppen är viktigast.",
                  cocktails: "För snyggare drinkstopp där miljö och känsla ska bära kvällen.",
                  party: "För när rundan ska växla upp och närma sig riktig utgångskänsla.",
                  beer: "För enklare, jordnära och mer pubdriven kväll med mindre krångel.",
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
              <div className="mt-3 text-2xl font-black text-amber-50">{prefs.vibes.length ? prefs.vibes.join(" + ") : "Ingen vibe vald ännu"}</div>
              <p className="mt-3 text-sm leading-6 text-amber-50/70">
                Appen försöker nu bygga en kväll som känns <span className="font-bold text-amber-50">sammanhängande</span>, inte bara korrekt. Det betyder att valen ska kännas som samma kväll, inte som tre separata idéer.
              </p>
              <div className="mt-4 rounded-3xl bg-black/10 p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-amber-300/70">Om du genererar nu</div>
                <div className="mt-2 text-sm text-amber-50/80">{route.length} stopp · {cityLabel} · ca {totalWalk} min gångtid</div>
                <div className="mt-2 text-sm text-amber-100/60">
                  Högst rankade första stopp just nu: <span className="font-bold text-amber-50">{route[0]?.name ?? "Inget än"}</span>
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
          subtitle="Nu går vi från bra känsla till rätt precision. Här styr du hur dyr, tät, lång och energifylld kvällen ska bli — utan att tappa flödet eller det där självklara i upplevelsen."
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <SliderRow
                  label="Prisnivå"
                  helper="Styr om rundan ska kännas budgetsmart, balanserad eller mer premium i tonen."
                  valueLabel={priceLabel}
                  min={1}
                  max={4}
                  value={prefs.price}
                  onChange={(next) => setPrefs((prev) => ({ ...prev, price: next }))}
                />
                <SliderRow
                  label="Hur mycket folk?"
                  helper="Berätta om du vill ha luft, lagom puls eller kväll där det redan känns laddat."
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
                  helper="Kort, skarp runda eller längre kväll med fler skiften i energi och miljö."
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
                        Tiden påverkar crowd- och energibedömning så att rundan känns mer realistisk.
                      </div>
                    </div>
                    <div className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">{prefs.start}</div>
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
                subtitle="Prioritera en kväll som flyter med kortare avstånd och mindre logistiskt brus mellan stoppen."
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
                  <span className="font-bold text-amber-50">Ton:</span> {priceLabel}, {crowdLabel} och {prefs.walkable ? "smidigt gångbar" : "mindre låst till avstånd"}.
                </div>
                <div>
                  <span className="font-bold text-amber-50">Rytm:</span> {prefs.stops <= 3 ? "kortare och skarpare" : prefs.stops <= 6 ? "balanserad med tydlig kvällsbåge" : "längre kväll med fler skiften och större variation"}.
                </div>
                <div>
                  <span className="font-bold text-amber-50">Nuvarande toppspår:</span> första stoppet ser just nu ut att bli <span className="font-bold text-amber-50">{route[0]?.name ?? "—"}</span>.
                </div>
                <div>
                  <span className="font-bold text-amber-50">Helhet:</span> appen försöker skapa en kväll som känns planerad av någon med smak, inte bara sorterad av en algoritm.
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
          title="Här är kvällen appen skulle planera åt dig"
          subtitle="Inte bara en lista. En faktiskt användbar barrunda med tydlig kvällsbåge, prisbild, känsla och alternativ om något känns lite fel när man ser helheten."
        >
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <div className="rounded-[28px] border border-amber-100/10 bg-[#231816] p-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-300/70">
                  <Sparkles size={14} />
                  AI-sammanfattning
                </div>
                <div className="mt-3 text-2xl font-black text-amber-50">{cityLabel} · {prefs.vibes.join(" + ")}</div>
                <p className="mt-3 text-sm leading-6 text-amber-50/75">
                  Det här är en kväll som ska kännas {priceLabel}, {crowdLabel} och {prefs.walkable ? "smidig att röra sig genom" : "friare i sin geografi"}. Appen försöker få energin att växa utan att tappa känslan av kontroll.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-black/10 p-3">
                    <div className="flex items-center gap-2 text-amber-300"><Clock3 size={14} /><span className="text-[11px] font-bold uppercase tracking-wide">Gångtid</span></div>
                    <div className="mt-2 text-lg font-black text-amber-50">{totalWalk} min</div>
                  </div>
                  <div className="rounded-2xl bg-black/10 p-3">
                    <div className="flex items-center gap-2 text-amber-300"><MapPin size={14} /><span className="text-[11px] font-bold uppercase tracking-wide">Stopp</span></div>
                    <div className="mt-2 text-lg font-black text-amber-50">{route.length}</div>
                  </div>
                  <div className="rounded-2xl bg-black/10 p-3">
                    <div className="flex items-center gap-2 text-amber-300"><MoonStar size={14} /><span className="text-[11px] font-bold uppercase tracking-wide">Start</span></div>
                    <div className="mt-2 text-lg font-black text-amber-50">{prefs.start}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-amber-100/10 bg-gradient-to-br from-amber-700/25 to-red-900/25 p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-amber-300/70">Känsla i helheten</div>
                <div className="mt-2 text-xl font-black text-amber-50">“Det här känns faktiskt som vår kväll.”</div>
                <p className="mt-3 text-sm leading-6 text-amber-50/75">
                  Det är precis den reaktionen appen ska trigga. Resultatet ska kännas personligt, inte generiskt. Man ska nästan vilja gå ut bara för att planen känns rätt.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {route.map((place, index) => (
                <RouteCard
                  key={`${place.id}-${index}`}
                  place={place}
                  index={index}
                  nextPlace={route[index + 1]}
                  onSwap={(nextVenue) => applySwap(index, nextVenue)}
                  alternatives={getAlternatives(place.id)}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <BackButton onClick={() => setStep(4)} />
            <PrimaryButton className="max-w-xs">
              Nästa: karta & spara runda <ChevronRight className="ml-2 inline-block" size={16} />
            </PrimaryButton>
          </div>
        </FlowFrame>
      )}
    </main>
  );
}