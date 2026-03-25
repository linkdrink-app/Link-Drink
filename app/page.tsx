"use client";

import { useMemo, useState } from "react";
import { venues, vibeCards } from "@/lib/data";
import { buildRank, buildRoute, walkMinutes } from "@/lib/ranking";
import { Preferences } from "@/lib/types";
import { PrimaryButton, SectionCard } from "@/components/ui";

export default function HomePage() {
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
    mirrorMode: false
  });

  const ranked = useMemo(() => {
    return venues
      .filter((v) => v.city === prefs.city)
      .map((v) => buildRank(v, prefs))
      .filter((v) => v.age <= prefs.youngest)
      .sort((a, b) => b.rank - a.rank);
  }, [prefs]);

  const route = useMemo(() => buildRoute(ranked.slice(0, prefs.stops)), [ranked, prefs.stops]);
  const totalWalk = useMemo(() => route.reduce((sum, r, i) => sum + (route[i + 1] ? walkMinutes(r, route[i + 1]) : 0), 0), [route]);

  const toggleVibe = (id: string) => {
    setPrefs((prev) => ({
      ...prev,
      vibes: prev.vibes.includes(id) ? prev.vibes.filter((v) => v !== id) : [...prev.vibes, id]
    }));
  };

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard>
          <div className="mb-3 inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">Link&Drink · starter</div>
          <h1 className="text-4xl font-black tracking-tight text-amber-50">Riktig webapp-grund</h1>
          <p className="mt-3 text-sm leading-6 text-amber-50/75">Nästa.js + Supabase + deploybar struktur. Det här är basen du lägger i GitHub och deployar på Vercel.</p>
        </SectionCard>

        <SectionCard>
          <div className="grid grid-cols-2 gap-3 text-sm font-bold">
            <div className="rounded-2xl bg-[#231816] p-4 text-amber-100">2 städer</div>
            <div className="rounded-2xl bg-[#231816] p-4 text-amber-100">10 stopp</div>
            <div className="rounded-2xl bg-[#231816] p-4 text-amber-100">Åldersfilter</div>
            <div className="rounded-2xl bg-[#231816] p-4 text-amber-100">Deploybar</div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard>
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-sm font-semibold text-amber-50">Stad</div>
              <select value={prefs.city} onChange={(e) => setPrefs((p) => ({ ...p, city: e.target.value as Preferences["city"] }))} className="w-full rounded-2xl border border-amber-100/10 bg-[#231816] px-4 py-3 text-amber-50">
                <option value="vasteras">Västerås</option>
                <option value="stockholm">Stockholm</option>
              </select>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-amber-50">Vibes</div>
              <div className="grid grid-cols-2 gap-3">
                {vibeCards.map((v) => (
                  <button key={v.id} onClick={() => toggleVibe(v.id)} className={`rounded-3xl border p-4 text-left transition active:scale-[0.98] ${prefs.vibes.includes(v.id) ? "border-transparent bg-gradient-to-br from-amber-700/40 to-red-900/40 shadow" : "border-amber-100/10 bg-[#231816]"}`}>
                    <div className="text-2xl">{v.emoji}</div>
                    <div className="mt-2 text-sm font-bold text-amber-50">{v.title}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-amber-50">Antal stopp: {prefs.stops}</div>
              <input type="range" min={2} max={10} value={prefs.stops} onChange={(e) => setPrefs((p) => ({ ...p, stops: Number(e.target.value) }))} className="w-full accent-amber-500" />
            </div>

            <PrimaryButton>Den här sidan är din riktiga bas</PrimaryButton>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="text-sm font-bold uppercase tracking-wide text-amber-300/70">Förhandsvisning</div>
          <div className="mt-2 text-sm text-amber-50/75">Ca {totalWalk} min gångtid · {route.length} stopp</div>
          <div className="mt-4 space-y-3">
            {route.map((place, i) => (
              <div key={place.id} className="rounded-2xl bg-[#231816] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-amber-300/70">Stopp {i + 1}</div>
                    <div className="text-lg font-black text-amber-50">{place.name}</div>
                    <div className="text-sm text-amber-100/60">{place.type} · {place.area}</div>
                  </div>
                  <div className="rounded-2xl bg-black/10 px-3 py-2 text-right">
                    <div className="text-[11px] font-bold text-amber-100/60">Match</div>
                    <div className="text-lg font-black text-amber-200">{place.rank}/100</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </main>
  );
}