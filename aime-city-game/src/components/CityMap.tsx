"use client";

import { useState } from "react";
import { ART, DISTRICTS, MISSIONS, PROS } from "@/lib/data";
import { districtById, euro, proById } from "@/lib/engine";
import { usePrefs } from "@/lib/prefs";
import { useAime } from "@/lib/store";
import type { Ambience, ViewId } from "@/lib/types";
import { Icon, Progress, Sheet, usePanZoom, type IconName } from "./ui";

const AMBIENCES: { id: Ambience; label: string; icon: IconName }[] = [
  { id: "day", label: "Jour", icon: "sun" },
  { id: "sunset", label: "Coucher", icon: "sunset" },
  { id: "night", label: "Nuit", icon: "moon" },
];

export default function CityMap({
  onOpenPro,
  onNavigate,
}: {
  onOpenPro: (proId: string, ids?: string[]) => void;
  onNavigate: (view: ViewId) => void;
}) {
  const { story, setAmbience, addPro, removePro, updateMission } = useAime();
  const { haptic, consoleMode } = usePrefs();
  const [districtId, setDistrictId] = useState<string | null>(null);
  const pan = usePanZoom({ min: 1, max: 3 });

  if (!story) return null;
  const crewIds = new Set(story.crew.map((entry) => entry.proId));
  const district = districtId ? districtById(districtId) : null;
  const districtPros = district ? PROS.filter((pro) => pro.districtId === district.id) : [];
  const districtMissions = district ? MISSIONS.filter((mission) => mission.districtId === district.id) : [];

  const illumination = (id: string) => {
    const pros = PROS.filter((pro) => pro.districtId === id);
    const missions = MISSIONS.filter((mission) => mission.districtId === id);
    const total = pros.length + missions.length;
    if (!total) return 0;
    const lit =
      pros.filter((pro) => crewIds.has(pro.id)).length + missions.filter((mission) => story.missions[mission.id]?.done).length;
    return Math.round((lit / total) * 100);
  };

  const cityLit = Math.round(DISTRICTS.reduce((sum, item) => sum + illumination(item.id), 0) / DISTRICTS.length);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="kicker">Le monde · carte interactive</p>
          <h1 className="title-1 mt-1">AIME® CITY</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip">
            <Icon name="spark" size={18} className="text-white" /> {cityLit}% allumée
          </span>
          <button type="button" onClick={() => onNavigate("casting")} className="btn btn-light">
            <Icon name="users" size={20} /> Casting
          </button>
        </div>
      </div>

      {/* -------- Carte plein écran tactile -------- */}
      <div
        className={`relative w-full overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.12)] bg-black ${
          consoleMode ? "h-[74dvh]" : "h-[58dvh] min-h-[380px] md:h-[68dvh]"
        }`}
      >
        <div
          ref={pan.ref}
          className={`ambience-${story.ambience} absolute inset-0 touch-none select-none ${pan.canPan ? "cursor-grab active:cursor-grabbing" : ""}`}
          {...pan.handlers}
        >
          <div className="absolute inset-[-8%] transition-transform duration-200 ease-out" style={{ transform: pan.transform }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ART.city} alt="Carte illustrée d'AIME® CITY au coucher du soleil" className="h-full w-full object-cover" draggable={false} />
            <div className="absolute inset-0 bg-[radial-gradient(65%_55%_at_50%_45%,transparent,rgba(0,0,0,0.55))]" />

            {DISTRICTS.map((item) => {
              const lit = illumination(item.id);
              const active = districtId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => {
                    haptic("tap");
                    setDistrictId(item.id);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${item.x}%`, top: `${item.y}%` }}
                  aria-label={`${item.name} — ${item.tagline}, ${lit}% illuminé`}
                >
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-full border-2 transition-transform duration-300 ${
                      active ? "scale-110 border-white bg-white text-black" : lit > 0 ? "border-white bg-white text-black" : "border-white/80 bg-black/80 text-white"
                    }`}
                  >
                    <Icon name="pin" size={22} strokeWidth={2} />
                  </span>
                  <span
                    className="mt-1.5 block max-w-[124px] rounded-full border border-[rgba(255,255,255,0.22)] bg-[rgba(0,0,0,0.88)] px-2.5 py-1 text-center text-[0.8125rem] font-semibold leading-tight text-cream backdrop-blur"
                  >
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Commandes flottantes */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="pointer-events-auto flex gap-1 rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(0,0,0,0.8)] p-1 backdrop-blur">
            {AMBIENCES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  haptic("soft");
                  setAmbience(item.id);
                }}
                aria-pressed={story.ambience === item.id}
                aria-label={`Ambiance ${item.label}`}
                className={`grid h-11 w-11 place-items-center rounded-full transition ${
                  story.ambience === item.id ? "bg-white text-[#000000]" : "text-cream/70"
                }`}
              >
                <Icon name={item.icon} size={22} />
              </button>
            ))}
          </div>
          <div className="pointer-events-auto flex flex-col gap-2">
            <button type="button" onClick={pan.zoomIn} className="icon-btn !border-[rgba(255,255,255,0.16)] !bg-black/70" aria-label="Zoomer sur la carte">
              <Icon name="zoomIn" size={22} />
            </button>
            <button type="button" onClick={pan.zoomOut} className="icon-btn !border-[rgba(255,255,255,0.16)] !bg-black/70" aria-label="Dézoomer la carte">
              <Icon name="zoomOut" size={22} />
            </button>
            <button type="button" onClick={pan.reset} className="icon-btn !border-[rgba(255,255,255,0.16)] !bg-black/70" aria-label="Recentrer la carte">
              <Icon name="target" size={22} />
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
          <span className="rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(0,0,0,0.82)] px-3 py-1.5 text-[0.8125rem] text-cream/70 backdrop-blur">
            {pan.zoom > 1 ? "Glissez pour explorer" : "Pincez pour zoomer · touchez un quartier"}
          </span>
          <span className="rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(0,0,0,0.82)] px-3 py-1.5 text-[0.8125rem] tabular text-cream/70 backdrop-blur">
            ×{pan.zoom.toFixed(1)}
          </span>
        </div>
      </div>

      {/* -------- Liste des quartiers -------- */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {DISTRICTS.map((item) => {
          const lit = illumination(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                haptic("tap");
                setDistrictId(item.id);
              }}
              className={`chip shrink-0 ${districtId === item.id ? "chip-active" : ""}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${lit > 0 ? "bg-white" : "bg-white/35"}`} />
              {item.name}
              <span className="tabular text-cream/45">{lit}%</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-soft p-6">
          <p className="kicker">Ville allumée</p>
          <p className="title-2 mt-4">{cityLit}%</p>
          <div className="mt-4">
            <Progress value={cityLit} />
          </div>
        </div>
        <div className="glass-soft p-6">
          <p className="kicker">Votre adresse</p>
          <p className="title-3 mt-4 truncate">{story.wedding.place || "Lieu à définir"}</p>
          <p className="meta mt-2">{story.wedding.guests} invités · {story.wedding.cityName}</p>
        </div>
        <button type="button" onClick={() => onNavigate("crew")} className="glass-soft p-6 text-left">
          <p className="kicker">Votre équipe</p>
          <p className="title-3 mt-1.5">{story.crew.length} personnages</p>
          <span className="mt-1 flex items-center gap-1 text-[0.9375rem] font-semibold text-white">
            Ouvrir l&apos;équipe <Icon name="arrowRight" size={18} />
          </span>
        </button>
      </div>

      {/* -------- Panneau quartier -------- */}
      <Sheet
        open={Boolean(district)}
        onClose={() => setDistrictId(null)}
        kicker={district?.tagline}
        title={district?.name}
        footer={
          <button type="button" onClick={() => onNavigate("histoire")} className="btn btn-ghost btn-block">
            Voir les missions du quartier <Icon name="arrowRight" size={20} />
          </button>
        }
      >
        {district && (
          <div className="space-y-5 p-5">
            <div className="relative h-40 overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={district.art} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.95))` }} />
              <div className="absolute inset-x-4 bottom-3">
                <p className="kicker text-white/70">{district.tagline}</p>
                <p className="title-2">{district.name}</p>
              </div>
            </div>

            <p className="text-[1rem] leading-relaxed text-cream/75">{district.description}</p>

            <div className="flex items-center gap-3">
              <Progress value={illumination(district.id)} />
              <span className="shrink-0 text-[0.9375rem] tabular text-cream/65">{illumination(district.id)}% allumé</span>
            </div>

            <div>
              <p className="kicker">Personnages du quartier</p>
              <div className="mt-2 space-y-2">
                {districtPros.map((pro) => {
                  const selected = crewIds.has(pro.id);
                  return (
                    <div key={pro.id} className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] p-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDistrictId(null);
                          onOpenPro(pro.id, districtPros.map((item) => item.id));
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={pro.art} alt="" className="h-full w-full object-cover" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[1.0625rem] font-semibold">{pro.name}</span>
                          <span className="meta block truncate">{pro.job} · {euro(pro.fee)}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          haptic(selected ? "soft" : "success");
                          if (selected) removePro(pro.id);
                          else addPro(pro.id);
                        }}
                        className={`icon-btn ${selected ? "icon-btn-active" : ""}`}
                        aria-label={selected ? `Retirer ${pro.name} de l'équipe` : `Ajouter ${pro.name} à l'équipe`}
                      >
                        <Icon name={selected ? "check" : "plus"} size={22} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="kicker">Missions du quartier</p>
              <div className="mt-2 space-y-2">
                {districtMissions.map((mission) => {
                  const done = story.missions[mission.id]?.done;
                  return (
                    <button
                      key={mission.id}
                      type="button"
                      onClick={() => {
                        haptic(done ? "soft" : "success");
                        updateMission(mission.id, { done: !done });
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.12)] p-3 text-left"
                    >
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border ${done ? "border-white bg-white text-[#000000]" : "border-[rgba(255,255,255,0.3)]"}`}>
                        <Icon name={done ? "check" : "plus"} size={22} />
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[1rem] font-semibold ${done ? "text-cream/50 line-through" : ""}`}>{mission.title}</span>
                        <span className="meta block truncate">{mission.reward}</span>
                      </span>
                    </button>
                  );
                })}
                {!districtMissions.length && <p className="meta">Aucune mission dans ce quartier pour l&apos;instant.</p>}
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
