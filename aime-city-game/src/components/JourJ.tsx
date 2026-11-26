"use client";

import { useState } from "react";
import { PROS } from "@/lib/data";
import { eventEnd, formatDate, proById, scheduleConflicts } from "@/lib/engine";
import { usePrefs } from "@/lib/prefs";
import { useAime } from "@/lib/store";
import type { DayEvent, ViewId } from "@/lib/types";
import { Icon, Sheet } from "./ui";

const STATUS: { id: DayEvent["status"]; label: string; color: string }[] = [
  { id: "prevu", label: "Prévu", color: "#858585" },
  { id: "confirme", label: "Confirmé", color: "#c5c5c5" },
  { id: "en_cours", label: "En cours", color: "#e5e5e5" },
  { id: "termine", label: "Terminé", color: "#ffffff" },
];

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

function Dial({ events, selectedId, onSelect, size = 300 }: { events: DayEvent[]; selectedId: string | null; onSelect: (id: string) => void; size?: number }) {
  const radius = 40;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size, maxWidth: "100%" }}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="0.7" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        {Array.from({ length: 24 }).map((_, index) => {
          const angle = (index / 24) * Math.PI * 2 - Math.PI / 2;
          const inner = index % 6 === 0 ? 42 : 44;
          return (
            <g key={index}>
              <line
                x1={50 + Math.cos(angle) * inner}
                y1={50 + Math.sin(angle) * inner}
                x2={50 + Math.cos(angle) * 47}
                y2={50 + Math.sin(angle) * 47}
                stroke={index % 6 === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)"}
                strokeWidth={index % 6 === 0 ? 0.9 : 0.5}
              />
              {index % 6 === 0 && (
                <text x={50 + Math.cos(angle) * 53} y={50 + Math.sin(angle) * 53} fill="rgba(255,255,255,0.6)" fontSize="4.4" textAnchor="middle" dominantBaseline="middle">
                  {String(index).padStart(2, "0")}h
                </text>
              )}
            </g>
          );
        })}
        {events.map((event) => {
          const angle = (toMinutes(event.start) / 1440) * Math.PI * 2 - Math.PI / 2;
          const status = STATUS.find((item) => item.id === event.status);
          const active = selectedId === event.id;
          return (
            <g key={event.id} onClick={() => onSelect(event.id)} className="cursor-pointer">
              <circle cx={50 + Math.cos(angle) * radius} cy={50 + Math.sin(angle) * radius} r="6" fill="transparent" />
              <circle cx={50 + Math.cos(angle) * radius} cy={50 + Math.sin(angle) * radius} r={active ? 4 : 2.8} fill={status?.color ?? "#ffffff"} stroke="#000000" strokeWidth="0.8" />
              {active && <circle cx={50 + Math.cos(angle) * radius} cy={50 + Math.sin(angle) * radius} r="6.4" fill="none" stroke={status?.color} strokeWidth="0.6" />}
            </g>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="kicker">Jour J</p>
          <p className="title-1 text-white">{events.length}</p>
          <p className="kicker">séquences</p>
        </div>
      </div>
    </div>
  );
}

export default function JourJ({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const { story, updateEvent, addEvent, removeEvent } = useAime();
  const { consoleMode, haptic } = usePrefs();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [immersive, setImmersive] = useState(false);
  if (!story) return null;

  const conflicts = scheduleConflicts(story.events);
  const conflictIds = new Set(conflicts.flatMap((conflict) => [conflict.a.id, conflict.b.id]));
  const sorted = [...story.events].sort((a, b) => a.start.localeCompare(b.start));
  const selected = story.events.find((event) => event.id === selectedId) ?? null;

  const openFullscreen = async () => {
    haptic("tap");
    setImmersive(true);
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      /* API plein écran optionnelle */
    }
  };
  const closeFullscreen = async () => {
    setImmersive(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  };

  const timeline = (
    <div className="space-y-2.5">
      {sorted.map((event) => {
        const pro = event.proId ? proById(event.proId) : undefined;
        const conflict = conflictIds.has(event.id);
        const status = STATUS.find((item) => item.id === event.status);
        return (
          <button
            key={event.id}
            type="button"
            onClick={() => {
              haptic("tap");
              setSelectedId(event.id);
            }}
            className={`flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition ${
              conflict ? "border-white/60 bg-[rgba(255,255,255,0.1)]" : "border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)]"
            }`}
          >
            <span className="w-[64px] shrink-0">
              <span className="title-2 block tabular text-white">{event.start}</span>
              <span className="meta block tabular text-cream/45">{eventEnd(event)}</span>
            </span>
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[rgba(255,255,255,0.18)] text-[1.5rem]">
              {event.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[1.0625rem] font-semibold">{event.title}</span>
              <span className="meta block truncate">{event.place}{pro ? ` · ${pro.name}` : ""}</span>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[0.875rem] font-semibold" style={{ color: status?.color }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: status?.color }} /> {status?.label}
              </span>
            </span>
            <Icon name="chevron" size={22} className="shrink-0 text-cream/40" />
          </button>
        );
      })}
    </div>
  );

  const content = (
    <>
      {conflicts.length > 0 ? (
        <div className="rounded-3xl border border-white/50 bg-[rgba(255,255,255,0.12)] p-4">
          <p className="kicker text-white">Conflits détectés · {conflicts.length}</p>
          {conflicts.map((conflict) => (
            <div key={`${conflict.a.id}-${conflict.b.id}`} className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[0.9375rem] text-cream/85">« {conflict.a.title} » et « {conflict.b.title} » se croisent sur {conflict.minutes} min</span>
              <button
                type="button"
                onClick={() => {
                  haptic("success");
                  updateEvent(conflict.b.id, { start: eventEnd(conflict.a) });
                }}
                className="chip chip-active"
              >
                <Icon name="clock" size={18} /> Décaler
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-[#ffffff]/35 bg-[rgba(255,255,255,0.08)] p-4 text-[1rem] text-cream/80">
          Aucun chevauchement : les durées sont compatibles avec les horaires.
        </div>
      )}

      <div className={consoleMode ? "grid gap-3 lg:grid-cols-[minmax(320px,420px)_1fr]" : "space-y-3"}>
        <div className="glass p-6">
          <p className="kicker">Cadran vivant · {formatDate(story.wedding.date)}</p>
          <div className="mt-2">
            <Dial events={story.events} selectedId={selectedId} onSelect={setSelectedId} size={consoleMode ? 300 : 280} />
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {STATUS.map((status) => (
              <span key={status.id} className="flex items-center gap-1.5 text-[0.875rem] text-cream/60">
                <span className="h-3 w-3 rounded-full" style={{ background: status.color }} /> {status.label}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {timeline}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { haptic("tap"); addEvent(); }} className="btn btn-ghost flex-1">
              <Icon name="plus" size={20} /> Ajouter une séquence
            </button>
            <button type="button" onClick={() => onNavigate("radio")} className="btn btn-ghost flex-1">
              <Icon name="radio" size={20} /> Bande-son
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="kicker">Le jour J</p>
          <h1 className="title-1 mt-1">Minute par minute</h1>
        </div>
        <button type="button" onClick={openFullscreen} className="btn btn-primary">
          <Icon name="external" size={20} /> Plein écran
        </button>
      </div>

      {content}

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        kicker={selected ? `${selected.start} → ${eventEnd(selected)}` : undefined}
        title={selected?.title}
        footer={
          selected && (
            <button
              type="button"
              onClick={() => {
                haptic("warn");
                removeEvent(selected.id);
                setSelectedId(null);
              }}
              className="btn btn-lg btn-danger btn-block"
            >
              <Icon name="trash" size={22} /> Supprimer la séquence
            </button>
          )
        }
      >
        {selected && (
          <div className="space-y-3 p-5">
            <label className="block">
              <span className="label">Titre</span>
              <input className="field" value={selected.title} onChange={(event) => updateEvent(selected.id, { title: event.target.value })} />
            </label>
            <label className="block">
              <span className="label">Lieu</span>
              <input className="field" value={selected.place} onChange={(event) => updateEvent(selected.id, { place: event.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="label">Début</span>
                <input type="time" className="field tabular" value={selected.start} onChange={(event) => updateEvent(selected.id, { start: event.target.value })} />
              </label>
              <label className="block">
                <span className="label">Durée (min)</span>
                <input type="number" inputMode="numeric" min={5} step={5} className="field tabular" value={selected.duration} onChange={(event) => updateEvent(selected.id, { duration: Number(event.target.value) })} />
              </label>
            </div>
            <label className="block">
              <span className="label">Statut</span>
              <select className="field" value={selected.status} onChange={(event) => updateEvent(selected.id, { status: event.target.value as DayEvent["status"] })}>
                {STATUS.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Personnage</span>
              <select className="field" value={selected.proId} onChange={(event) => updateEvent(selected.id, { proId: event.target.value })}>
                <option value="">Aucun personnage</option>
                {PROS.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} — {item.job}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Plan B</span>
              <input className="field" placeholder="Si la pluie, si la sono tombe…" value={selected.planB} onChange={(event) => updateEvent(selected.id, { planB: event.target.value })} />
            </label>
          </div>
        )}
      </Sheet>

      {immersive && (
        <div className="fixed inset-0 z-[95] overflow-y-auto bg-black p-5">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="kicker">Régie du jour</p>
                <h2 className="title-1">{story.wedding.partnerA} &amp; {story.wedding.partnerB}</h2>
                <p className="meta mt-1">{formatDate(story.wedding.date)} · {story.wedding.place}</p>
              </div>
              <button type="button" onClick={closeFullscreen} className="icon-btn icon-btn-lg" aria-label="Quitter le plein écran">
                <Icon name="close" size={26} />
              </button>
            </div>
            <div className="space-y-3">
              {sorted.map((event) => {
                const status = STATUS.find((item) => item.id === event.status);
                const pro = event.proId ? proById(event.proId) : undefined;
                return (
                  <div key={event.id} className="flex items-center gap-4 rounded-3xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.05)] p-4">
                    <span className="title-1 w-[92px] shrink-0 tabular text-white">{event.start}</span>
                    <span className="text-[2rem]">{event.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="title-2 block truncate">{event.title}</span>
                      <span className="meta block truncate">{event.place}{pro ? ` · ${pro.name}` : ""}</span>
                    </span>
                    <span className="hidden shrink-0 text-[1rem] font-semibold sm:block" style={{ color: status?.color }}>{status?.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
