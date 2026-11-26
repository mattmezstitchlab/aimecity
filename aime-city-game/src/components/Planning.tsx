"use client";

import { useState } from "react";
import { CHAPTERS, MISSIONS } from "@/lib/data";
import { daysUntil, districtById, doneMissions, euro, formatDate, proById, progressPercent, shortDate } from "@/lib/engine";
import { usePrefs } from "@/lib/prefs";
import { useAime } from "@/lib/store";
import type { Mission, ViewId } from "@/lib/types";
import { Icon, Progress, Sheet } from "./ui";

const offsetDate = (base: string, days: number) => {
  if (!base) return "";
  const date = new Date(`${base.slice(0, 10)}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

function MissionSheet({
  mission,
  onClose,
  onOpenPro,
}: {
  mission: Mission | null;
  onClose: () => void;
  onOpenPro: (proId: string) => void;
}) {
  const { story, toggleMission, updateMission } = useAime();
  const { haptic } = usePrefs();
  if (!story || !mission) return null;
  const state = story.missions[mission.id];
  const done = Boolean(state?.done);
  const district = districtById(mission.districtId);
  const reveal = proById(mission.revealProId);

  return (
    <Sheet
      open={Boolean(mission)}
      onClose={onClose}
      kicker={`Mission ${String(mission.index).padStart(2, "0")} · ${district?.name}`}
      title={mission.title}
      footer={
        <button
          type="button"
          onClick={() => {
            haptic(done ? "soft" : "success");
            toggleMission(mission.id);
          }}
          className={`btn btn-lg btn-block ${done ? "btn-ghost" : "btn-primary"}`}
        >
          <Icon name={done ? "reset" : "check"} size={22} /> {done ? "Repasser en cours" : "Accomplir la mission"}
        </button>
      }
    >
      <div className="space-y-4 p-5">
        <div className="relative h-40 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={district?.art} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_25%,rgba(0,0,0,0.95))]" />
          <span className="absolute left-4 top-4 grid h-12 w-12 place-items-center rounded-2xl border border-[rgba(255,255,255,0.3)] bg-[rgba(0,0,0,0.7)] text-[1.5rem]">
            {mission.icon}
          </span>
          <p className="absolute inset-x-4 bottom-3 text-[1rem] font-semibold text-cream/85">{mission.reward}</p>
        </div>

        <p className="text-[1.0625rem] leading-relaxed text-cream/80">{mission.brief}</p>

        {reveal && (
          <button type="button" onClick={() => { onClose(); onOpenPro(reveal.id); }} className="glass-soft flex w-full items-center gap-3 p-3 text-left">
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={reveal.art} alt="" className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[1.0625rem] font-semibold">{reveal.name}</span>
              <span className="meta block truncate">{reveal.job} · {euro(reveal.fee)}</span>
            </span>
            <Icon name="chevron" size={22} className="shrink-0 text-cream/50" />
          </button>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Date / agenda</span>
            <input
              type="date"
              className="field"
              value={state?.date || offsetDate(story.wedding.date, mission.offsetDays)}
              onChange={(event) => updateMission(mission.id, { date: event.target.value })}
            />
          </label>
          <label className="block">
            <span className="label">Choix retenu</span>
            <input className="field" placeholder={mission.action} value={state?.choice ?? ""} onChange={(event) => updateMission(mission.id, { choice: event.target.value })} />
          </label>
        </div>
        <label className="block">
          <span className="label">Note</span>
          <textarea className="field" value={state?.note ?? ""} onChange={(event) => updateMission(mission.id, { note: event.target.value })} />
        </label>
        <label className="block">
          <span className="label">Plan B</span>
          <input className="field" placeholder="Si la pluie, si le retard, si la panne…" value={state?.planB ?? ""} onChange={(event) => updateMission(mission.id, { planB: event.target.value })} />
        </label>
      </div>
    </Sheet>
  );
}

export function StoryView({
  onOpenPro,
  onNavigate,
}: {
  onOpenPro: (proId: string, ids?: string[]) => void;
  onNavigate: (view: ViewId) => void;
}) {
  const { story } = useAime();
  const { haptic } = usePrefs();
  const [chapterId, setChapterId] = useState("ch1");
  const [openMission, setOpenMission] = useState<Mission | null>(null);
  if (!story) return null;

  const chapter = CHAPTERS.find((item) => item.id === chapterId) ?? CHAPTERS[0];
  const missions = MISSIONS.filter((mission) => mission.chapterId === chapter.id);
  const next = MISSIONS.find((mission) => !story.missions[mission.id]?.done);
  const globalDone = doneMissions(story);

  return (
    <div className="space-y-4">
      <section className="section first:border-t-0 first:pt-0">
        <p className="kicker">Mode histoire · progression libre</p>
        <h1 className="title-1 mt-4">Huit chapitres, 24 missions</h1>
      </section>

      <div className="glass p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="kicker">Progression du monde</p>
          <span className="title-3 tabular">{progressPercent(story)}%</span>
        </div>
        <div className="mt-2">
          <Progress value={progressPercent(story)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="chip tabular">{globalDone}/24 missions</span>
          <span className="chip tabular">{story.crew.length} personnages</span>
          <span className="chip tabular">J-{daysUntil(story.wedding.date) ?? "?"}</span>
        </div>
        {next && (
          <button
            type="button"
            onClick={() => {
              haptic("tap");
              setOpenMission(next);
            }}
            className="btn btn-lg btn-primary btn-block mt-4"
          >
            <Icon name="spark" size={22} /> Prochaine action : {next.title}
          </button>
        )}
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {CHAPTERS.map((item) => {
          const items = MISSIONS.filter((mission) => mission.chapterId === item.id);
          const done = items.filter((mission) => story.missions[mission.id]?.done).length;
          const active = chapterId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setChapterId(item.id)}
              className={`min-h-[64px] w-[168px] shrink-0 rounded-2xl border p-3 text-left transition ${
                active ? "border-white bg-[rgba(255,255,255,0.16)]" : "border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              <span className="kicker">Chapitre {item.index} · {done}/3</span>
              <span className="mt-1 block text-[0.9375rem] font-semibold leading-tight">{item.title}</span>
            </button>
          );
        })}
      </div>

      <section className="card overflow-hidden">
        <div className="relative h-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={districtById(missions[0]?.districtId ?? "love")?.art} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.92),rgba(0,0,0,0.36))]" />
          <div className="absolute inset-0 flex flex-col justify-end p-4">
            <p className="kicker text-white/80">Chapitre {chapter.index} · {chapter.subtitle}</p>
            <h2 className="title-2">{chapter.title}</h2>
          </div>
        </div>
        <div className="divide-y divide-[rgba(255,255,255,0.1)]">
          {missions.map((mission) => {
            const state = story.missions[mission.id];
            const done = Boolean(state?.done);
            const reveal = proById(mission.revealProId);
            return (
              <div key={mission.id} className="flex items-center gap-3 p-4">
                <button
                  type="button"
                  onClick={() => {
                    haptic(done ? "soft" : "success");
                    setOpenMission(mission);
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className={`title-3 ${done ? "text-cream/50 line-through" : ""}`}>
                    <span className="mr-2 text-cream/35 tabular">{String(mission.index).padStart(2, "0")}</span>
                    {mission.title}
                  </p>
                  <p className="meta mt-0.5 line-clamp-2">{mission.brief}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {reveal && <span className="chip">{reveal.name}</span>}
                    {done && state?.date && <span className="chip chip-active">{shortDate(state.date)}</span>}
                  </div>
                </button>
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border ${done ? "border-white bg-white text-[#000000]" : "border-[rgba(255,255,255,0.3)] text-cream/60"}`}>
                  <Icon name={done ? "check" : "chevron"} size={24} />
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => onNavigate("monde")} className="glass-soft p-4 text-left">
          <p className="kicker">Le monde change</p>
          <p className="mt-1 text-[1rem] text-cream/75">Chaque mission illumine un quartier.</p>
          <span className="mt-1 flex items-center gap-1 text-[0.9375rem] font-semibold text-white">Explorer <Icon name="arrowRight" size={18} /></span>
        </button>
        <button type="button" onClick={() => onNavigate("casting")} className="glass-soft p-4 text-left">
          <p className="kicker">Les personnages</p>
          <p className="mt-1 text-[1rem] text-cream/75">Chaque mission révèle un métier.</p>
          <span className="mt-1 flex items-center gap-1 text-[0.9375rem] font-semibold text-white">Casting <Icon name="arrowRight" size={18} /></span>
        </button>
        <button type="button" onClick={() => onNavigate("agenda")} className="glass-soft p-4 text-left">
          <p className="kicker">Agenda</p>
          <p className="mt-1 text-[1rem] text-cream/75">La mosaïque des 24 missions.</p>
          <span className="mt-1 flex items-center gap-1 text-[0.9375rem] font-semibold text-white">Calendrier <Icon name="arrowRight" size={18} /></span>
        </button>
      </div>

      <MissionSheet mission={openMission} onClose={() => setOpenMission(null)} onOpenPro={onOpenPro} />
    </div>
  );
}

export function CalendarView({
  onNavigate,
  onOpenPro,
}: {
  onNavigate: (view: ViewId) => void;
  onOpenPro: (proId: string, ids?: string[]) => void;
}) {
  const { story, toggleMission } = useAime();
  const { haptic } = usePrefs();
  const [openMission, setOpenMission] = useState<Mission | null>(null);
  if (!story) return null;
  const next = MISSIONS.find((mission) => !story.missions[mission.id]?.done);
  const finalDone = Boolean(story.missions.m24?.done);

  return (
    <div className="space-y-4">
      <section className="section first:border-t-0 first:pt-0">
        <p className="kicker">Calendrier · 24 missions illustrées</p>
        <h1 className="title-1 mt-4">Votre agenda</h1>
      </section>

      <div className="glass p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="kicker truncate">{formatDate(story.wedding.date)}</p>
            <p className="title-2 mt-1 tabular">{doneMissions(story)}/24 accomplies</p>
          </div>
          <span className="chip tabular shrink-0">J-{daysUntil(story.wedding.date) ?? "?"}</span>
        </div>
        <div className="mt-3">
          <Progress value={progressPercent(story)} />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => next && setOpenMission(next)}
            disabled={!next}
            className="btn btn-lg btn-primary"
          >
            <Icon name="spark" size={22} /> Prochaine action
          </button>
          <button type="button" onClick={() => onNavigate("studio")} className="btn btn-lg btn-ghost">
            <Icon name="studio" size={22} /> {finalDone ? "Mini-site généré" : "Mini-site (mission 24)"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 landscape:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
        {MISSIONS.map((mission) => {
          const state = story.missions[mission.id];
          const done = Boolean(state?.done);
          const district = districtById(mission.districtId);
          return (
            <button
              key={mission.id}
              type="button"
              onClick={() => {
                haptic("tap");
                setOpenMission(mission);
              }}
              className={`group relative aspect-[3/4] overflow-hidden rounded-2xl border text-left ${done ? "border-white/70" : "border-[rgba(255,255,255,0.14)]"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={district?.art} alt="" loading="lazy" className={`h-full w-full object-cover ${done ? "" : "opacity-85 saturate-[0.9]"}`} />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.94))]" />
              <span className="absolute left-2 top-2 rounded-full bg-[rgba(0,0,0,0.85)] px-2 py-0.5 text-[0.8125rem] font-semibold tabular">
                {String(mission.index).padStart(2, "0")}
              </span>
              <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-[rgba(255,255,255,0.3)] bg-[rgba(0,0,0,0.7)] text-[1rem]">
                {mission.icon}
              </span>
              {done && (
                <span className="absolute right-2 top-12 grid h-8 w-8 place-items-center rounded-full bg-white text-[#000000]">
                  <Icon name="check" size={18} strokeWidth={2.4} />
                </span>
              )}
              <span className="absolute inset-x-2 bottom-2">
                <span className="block text-[0.875rem] font-semibold leading-tight">{mission.title}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="glass p-6">
          <p className="kicker">Prochaine étape</p>
          <h2 className="title-2 mt-1">{next?.title ?? "Les 24 missions sont accomplies"}</h2>
          <p className="mt-1.5 text-[0.9375rem] text-cream/65">{next?.brief ?? "Votre monde est complet : publiez le mini-site et écrivez les remerciements."}</p>
          {next && (
            <button
              type="button"
              onClick={() => {
                haptic("success");
                toggleMission(next.id);
              }}
              className="btn btn-lg btn-primary btn-block mt-3"
            >
              Accomplir maintenant
            </button>
          )}
        </div>
        <div className="glass p-6">
          <p className="kicker">Agenda prestataires</p>
          <div className="mt-2 space-y-2">
            {story.crew.slice(0, 6).map((entry) => {
              const pro = proById(entry.proId);
              if (!pro) return null;
              return (
                <button key={entry.proId} type="button" onClick={() => onOpenPro(pro.id)} className="flex w-full items-center justify-between gap-3 text-left">
                  <span className="min-w-0 truncate text-[1rem] text-cream/80">{pro.name}</span>
                  <span className="meta shrink-0 tabular">{entry.time}</span>
                </button>
              );
            })}
            {!story.crew.length && (
              <button type="button" onClick={() => onNavigate("casting")} className="text-[1rem] font-semibold text-white">
                Aucun prestataire · ouvrir le casting
              </button>
            )}
          </div>
        </div>
      </div>

      <MissionSheet mission={openMission} onClose={() => setOpenMission(null)} onOpenPro={onOpenPro} />
    </div>
  );
}
