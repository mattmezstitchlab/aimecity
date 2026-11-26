"use client";

import { useState } from "react";
import { ART, DISTRICTS, MOODS, PROS, RADIO_STATIONS } from "@/lib/data";
import { daysUntil, doneMissions, euro, formatDate, progressPercent } from "@/lib/engine";
import { usePrefs } from "@/lib/prefs";
import { useAime } from "@/lib/store";
import type { Wedding } from "@/lib/types";
import { Icon, Sheet } from "./ui";

export default function Landing() {
  const { story, hydrated, startDemo, startNewStory, exploreFreely, resumeStory } = useAime();
  const { haptic } = usePrefs();
  const [onboarding, setOnboarding] = useState(false);
  const [form, setForm] = useState<Wedding>({
    partnerA: "",
    partnerB: "",
    date: "",
    place: "",
    cityName: "AIME® CITY",
    guests: 80,
    budget: 25000,
    mood: "golden",
    note: "",
  });

  const savedStory = story && (story.crew.length > 0 || doneMissions(story) > 0) ? story : null;
  const valid = form.partnerA.trim().length > 0 && form.partnerB.trim().length > 0 && Boolean(form.date);

  const submit = () => {
    if (!valid) return;
    haptic("success");
    startNewStory({ ...form, cityName: form.cityName || "AIME® CITY" });
    setOnboarding(false);
  };

  return (
    <main className="min-h-dvh bg-noir">
      <section className="relative isolate flex min-h-dvh flex-col overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ART.hero} alt="Un couple sur une terrasse face à AIME® CITY au coucher du soleil" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.55)_38%,rgba(0,0,0,0.96)_82%)]" />
        <div className="grain absolute inset-0 -z-10 opacity-35" />

        <header className="safe-t flex items-center justify-between gap-3 px-5 pt-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/40 bg-[rgba(0,0,0,0.6)] text-white">
              <Icon name="heart" size={24} />
            </span>
            <div>
              <p className="title-3 tracking-[0.08em]">AIME® CITY</p>
              <p className="kicker">Love is an open world</p>
            </div>
          </div>
          <span className="chip">Sans inscription</span>
        </header>

        <div className="flex flex-1 flex-col justify-end px-5 pb-8 pt-16 sm:px-10">
          <div className="rise max-w-3xl">
            <h1 className="title-hero">
              AIME<sup className="align-top text-[0.3em] text-white">®</sup>
              <span className="text-white block">CITY</span>
            </h1>
            <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-cream/85 sm:text-[1.25rem]">
              Les mariés sont les protagonistes, les prestataires sont les personnages, les préparatifs sont les missions.
              <span className="text-cream"> Le mariage est l&apos;aventure.</span>
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:max-w-xl">
            <button
              type="button"
              onClick={() => {
                haptic("tap");
                setOnboarding(true);
              }}
              className="btn btn-lg btn-light w-full justify-between gap-4 !min-h-[84px] !px-6 text-left"
            >
              <span className="min-w-0">
                <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.18em] opacity-55">01 — Commencer</span>
                <span className="title-2 mt-1 block">Nouvelle histoire</span>
                <span className="mt-1 block text-[0.9375rem] opacity-65">Prénoms, date, lieu, invités, budget</span>
              </span>
              <Icon name="arrowRight" size={26} className="shrink-0" />
            </button>

            <button
              type="button"
              disabled={!hydrated || !savedStory}
              onClick={() => savedStory && resumeStory()}
              className="btn btn-lg btn-ghost w-full justify-between gap-4 !min-h-[84px] !px-6 text-left"
            >
              <span className="min-w-0">
                <span className="kicker">02 — Reprendre</span>
                <span className="title-2 mt-1 block">Continuer mon histoire</span>
                <span className="meta mt-0.5 block truncate">
                  {savedStory
                    ? `${savedStory.wedding.partnerA} & ${savedStory.wedding.partnerB} · ${progressPercent(savedStory)}%`
                    : "Aucune partie sauvegardée"}
                </span>
              </span>
              <Icon name={savedStory ? "arrowRight" : "lock"} size={28} className="shrink-0 text-cream/60" />
            </button>

            <button
              type="button"
              onClick={() => {
                haptic("tap");
                exploreFreely();
              }}
              className="btn btn-lg btn-ghost w-full justify-between gap-4 !min-h-[84px] !px-6 text-left"
            >
              <span className="min-w-0">
                <span className="kicker">03 — Sans contrainte</span>
                <span className="title-2 mt-1 block">Explorer librement</span>
                <span className="meta mt-0.5 block">Entrer dans la ville et toucher les personnages</span>
              </span>
              <Icon name="world" size={28} className="shrink-0 text-cream/60" />
            </button>

            <button type="button" onClick={() => startDemo()} className="btn btn-lg btn-ghost">
              <Icon name="play" size={22} /> Partie démo · Camille &amp; Gabriel
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden border-t border-[rgba(255,255,255,0.1)] bg-black py-4">
          <div className="marquee-track flex w-[200%] gap-8 whitespace-nowrap">
            {[0, 1].map((loop) => (
              <div key={loop} className="flex shrink-0 gap-8">
                {DISTRICTS.map((district) => (
                  <span key={`${loop}-${district.id}`} className="flex items-center gap-2 text-[0.8125rem] uppercase tracking-[0.16em] text-cream/55">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                    {district.name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section px-5 sm:px-10">
        <p className="kicker">Le manifeste</p>
        <h2 className="title-1 mt-4 max-w-3xl">
          On ne joue plus pour s&apos;échapper de la réalité. <span className="text-white/45">On joue pour la construire.</span>
        </h2>
        <p className="body-lg mt-6 max-w-2xl">
          Un moteur narratif pour votre mariage — et demain pour vos festivals, anniversaires, voyages et projets artistiques.
        </p>
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          { icon: "world" as const, title: "Un monde, pas un formulaire", text: "12 quartiers illustrés, 113 métiers, une carte qui s'illumine à chaque décision." },
          { icon: "crew" as const, title: `${PROS.length} personnages à recruter`, text: "Saxophoniste, photographe, fleuriste, officiante… Comparez et composez votre équipe." },
          { icon: "aria" as const, title: "ARIA veille sur tout", text: `Budget vivant, conflits horaires, métiers manquants et ${RADIO_STATIONS.length} univers radio.` },
        ].map((pillar) => (
          <article key={pillar.title} className="glass-soft p-7">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-[rgba(255,255,255,0.18)] text-white">
              <Icon name={pillar.icon} size={22} />
            </span>
            <h3 className="title-3 mt-6">{pillar.title}</h3>
            <p className="mt-3 text-[1rem] leading-relaxed text-white/65">{pillar.text}</p>
          </article>
        ))}
        </div>
      </section>

      <footer className="safe-b px-5 pb-8 text-[0.875rem] leading-relaxed text-cream/45 sm:px-10">
        AIME® CITY · Love is an open world · personnages, tarifs et disponibilités fictifs · sauvegarde locale, aucun compte requis.
      </footer>

      <Sheet
        open={onboarding}
        onClose={() => setOnboarding(false)}
        kicker="Nouvelle histoire · 2 minutes"
        title="Créez votre monde"
        wide
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={() => startDemo()} className="btn btn-lg btn-ghost">Démo</button>
            <button type="button" disabled={!valid} onClick={submit} className="btn btn-lg btn-primary flex-1">
              Ouvrir mon monde <Icon name="arrowRight" size={22} />
            </button>
          </div>
        }
      >
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Prénom 1</span>
              <input className="field" value={form.partnerA} onChange={(event) => setForm({ ...form, partnerA: event.target.value })} placeholder="Camille" autoComplete="off" />
            </label>
            <label className="block">
              <span className="label">Prénom 2</span>
              <input className="field" value={form.partnerB} onChange={(event) => setForm({ ...form, partnerB: event.target.value })} placeholder="Gabriel" autoComplete="off" />
            </label>
          </div>
          <label className="block">
            <span className="label">Date du mariage</span>
            <input type="date" className="field" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </label>
          <label className="block">
            <span className="label">Lieu</span>
            <input className="field" value={form.place} onChange={(event) => setForm({ ...form, place: event.target.value })} placeholder="Domaine, ville, pays" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Invités</span>
              <input type="number" inputMode="numeric" min={2} max={900} className="field tabular" value={form.guests} onChange={(event) => setForm({ ...form, guests: Number(event.target.value) })} />
            </label>
            <label className="block">
              <span className="label">Budget</span>
              <input type="number" inputMode="numeric" min={0} step={500} className="field tabular" value={form.budget} onChange={(event) => setForm({ ...form, budget: Number(event.target.value) })} />
            </label>
          </div>
          <div>
            <span className="label">Ambiance</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => setForm({ ...form, mood: mood.id })}
                  className={`min-h-[64px] rounded-2xl border p-3 text-left ${
                    form.mood === mood.id ? "border-white bg-[rgba(255,255,255,0.16)]" : "border-[rgba(255,255,255,0.14)]"
                  }`}
                >
                  <span className="block text-[1rem] font-semibold">{mood.label}</span>
                  <span className="meta block">{mood.detail}</span>
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="label">Une phrase pour votre histoire (optionnel)</span>
            <textarea className="field" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Ce qui rend cette journée unique…" />
          </label>

          <div className="glass-soft p-4">
            <p className="kicker">Aperçu</p>
            <p className="title-2 mt-1">
              {form.partnerA || "Prénom"} <span className="text-white">&amp;</span> {form.partnerB || "Prénom"}
            </p>
            <p className="meta mt-1">
              {form.date ? formatDate(form.date) : "date à définir"} · {form.place || "lieu à définir"} · {form.guests} invités · {euro(form.budget)}
              {form.date && daysUntil(form.date) !== null ? ` · J-${daysUntil(form.date)}` : ""}
            </p>
          </div>

          <p className="meta text-cream/45">
            Aucune inscription. Tout reste dans votre navigateur. Tarifs, disponibilités et personnages sont fictifs : aucune
            réservation réelle n&apos;est créée.
          </p>
        </div>
      </Sheet>
    </main>
  );
}
