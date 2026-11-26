"use client";

import { useMemo, useRef, useState } from "react";
import { COMPLEMENTS, MISSIONS, STATUS_LABELS, STATUS_ORDER } from "@/lib/data";
import { complementarySuggestions, computeBudget, coverageGaps, districtById, euro, proById } from "@/lib/engine";
import { usePrefs } from "@/lib/prefs";
import { useAime } from "@/lib/store";
import type { ProStatus, ViewId } from "@/lib/types";
import { Icon, Progress, Segmented, Sheet, usePanZoom } from "./ui";

export default function Crew({
  onOpenPro,
  onNavigate,
}: {
  onOpenPro: (proId: string, ids?: string[]) => void;
  onNavigate: (view: ViewId) => void;
}) {
  const { story, updateCrew, removePro, addPro } = useAime();
  const { haptic } = usePrefs();
  const [tab, setTab] = useState<"gallery" | "constellation">("gallery");
  const [editing, setEditing] = useState<string | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const panRef = useRef<HTMLDivElement>(null);
  const pan = usePanZoom(panRef, { min: 1, max: 2.6 });

  const crew = useMemo(() => story?.crew ?? [], [story?.crew]);
  const nodes = useMemo(
    () =>
      crew.slice(0, 12).map((entry, index, array) => {
        const angle = (index / Math.max(1, array.length)) * Math.PI * 2 - Math.PI / 2;
        return { entry, pro: proById(entry.proId), x: 50 + Math.cos(angle) * 34, y: 50 + Math.sin(angle) * 34 };
      }),
    [crew],
  );

  const links = useMemo(() => {
    const byId = new Map(nodes.map((node) => [node.entry.proId, node]));
    const pairs: { key: string; a: { x: number; y: number }; b: { x: number; y: number } }[] = [];
    for (const node of nodes) {
      for (const complement of COMPLEMENTS[node.entry.proId] ?? []) {
        const target = byId.get(complement);
        if (target) pairs.push({ key: `${node.entry.proId}-${complement}`, a: node, b: target });
      }
    }
    return pairs;
  }, [nodes]);

  if (!story) return null;
  const budget = computeBudget(story);
  const gaps = coverageGaps(story);
  const suggestions = complementarySuggestions(story);
  const crewIds = new Set(story.crew.map((entry) => entry.proId));
  const discovered = [...new Set(MISSIONS.filter((mission) => story.missions[mission.id]?.done).map((mission) => mission.revealProId))].filter(
    (id) => !crewIds.has(id),
  );

  return (
    <div className="space-y-4">
      <section className="section first:border-t-0 first:pt-0">
        <h1 className="title-1 mt-4">Votre équipe</h1>
      </section>

      {/* Indicateur budget compact */}
      <button type="button" onClick={() => setBudgetOpen(true)} className="glass w-full p-6 text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="title-2 mt-1 tabular">{euro(budget.estimated)} <span className="text-cream/40">/ {euro(budget.initial)}</span></p>
          </div>
          <span className="icon-btn shrink-0">
            <Icon name="chevron" size={22} />
          </span>
        </div>
        <div className="mt-3">
          <Progress value={budget.estimatePercent} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="chip">{story.crew.length} personnages</span>
          <span className="chip tabular">Confirmé {euro(budget.committed)}</span>
          <span className="chip tabular">Disponible {euro(budget.available)}</span>
        </div>
      </button>

      <Segmented
        ariaLabel="Affichage de l'équipe"
        value={tab}
        onChange={setTab}
        options={[
          { id: "gallery", label: "Galerie", icon: "grid" },
          { id: "constellation", label: "Constellation", icon: "layers" },
        ]}
      />

      {tab === "constellation" ? (
        <div className="space-y-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.14)] bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,255,255,0.14),rgba(0,0,0,0.9))]">
            <div ref={panRef} className="absolute inset-0 touch-none" {...pan.handlers}>
              <div className="absolute inset-0 transition-transform duration-200" style={{ transform: pan.transform }}>
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="crewLink" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#e5e5e5" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.25" />
                  <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.25" />
                  {links.map((link) => (
                    <line key={link.key} x1={link.a.x} y1={link.a.y} x2={link.b.x} y2={link.b.y} stroke="url(#crewLink)" strokeWidth="0.5" strokeDasharray="1.6 1.6" opacity="0.8" />
                  ))}
                </svg>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="title-3 text-white">{story.wedding.partnerA || "Vous"}</p>
                  <p className="title-3 text-white">&amp; {story.wedding.partnerB || "…"}</p>
                </div>
                {nodes.map((node) =>
                  node.pro ? (
                    <button
                      key={node.entry.proId}
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => onOpenPro(node.entry.proId, crew.map((entry) => entry.proId))}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-2 py-1.5 text-center"
                      style={{ left: `${node.x}%`, top: `${node.y}%`, borderColor: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.92)" }}
                    >
                      <span className="block text-[0.9375rem] font-semibold leading-tight">{node.pro.name.split(" ")[0]}</span>
                      <span className="block text-[0.8125rem] text-cream/65">{node.pro.job.split(" ")[0]}</span>
                    </button>
                  ) : null,
                )}
              </div>
            </div>
            <div className="absolute right-3 top-3 flex flex-col gap-2">
              <button type="button" onClick={pan.zoomIn} className="icon-btn bg-[rgba(0,0,0,0.8)]" aria-label="Zoomer la constellation">
                <Icon name="zoomIn" size={22} />
              </button>
              <button type="button" onClick={pan.zoomOut} className="icon-btn bg-[rgba(0,0,0,0.8)]" aria-label="Dézoomer la constellation">
                <Icon name="zoomOut" size={22} />
              </button>
              <button type="button" onClick={pan.reset} className="icon-btn bg-[rgba(0,0,0,0.8)]" aria-label="Recentrer la constellation">
                <Icon name="target" size={22} />
              </button>
            </div>
            {!nodes.length && (
              <p className="absolute inset-x-4 bottom-4 rounded-2xl border border-[rgba(255,255,255,0.16)] bg-[rgba(0,0,0,0.85)] p-4 text-center text-[0.9375rem] text-cream/70">
                Ajoutez un personnage pour voir les liens.
              </p>
            )}
          </div>

          <div className="glass p-4">
            <p className="kicker">Suggérés pour compléter</p>
            <div className="mt-3 space-y-2">
              {suggestions.map(({ pro, count }) => (
                <div key={pro.id} className="flex items-center gap-3">
                  <button type="button" onClick={() => onOpenPro(pro.id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[1.0625rem] font-semibold">{pro.name}</span>
                    <span className="meta block truncate">{pro.job} · {count} lien{count > 1 ? "s" : ""}</span>
                  </button>
                  <button type="button" onClick={() => addPro(pro.id)} className="icon-btn" aria-label={`Ajouter ${pro.name}`}>
                    <Icon name="plus" size={22} />
                  </button>
                </div>
              ))}
              {!suggestions.length && <p className="meta">Ajoutez un personnage pour voir les suggestions.</p>}
            </div>
          </div>
        </div>
      ) : (
        <>
          {story.crew.length === 0 ? (
            <div className="glass-soft flex flex-col items-center gap-4 p-8 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-[rgba(255,255,255,0.2)] text-white">
                <Icon name="crew" size={30} />
              </span>
              <h2 className="title-2">Votre équipe est encore vide</h2>
              <p className="max-w-md text-[1rem] text-cream/65">
                {gaps.length} métiers clés à couvrir.
              </p>
              <button type="button" onClick={() => onNavigate("casting")} className="btn btn-lg btn-primary">
                Ouvrir le casting <Icon name="arrowRight" size={20} />
              </button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {story.crew.map((entry) => {
                const pro = proById(entry.proId);
                if (!pro) return null;
                const district = districtById(pro.districtId);
                const open = editing === pro.id;
                return (
                  <article key={entry.proId} className="card overflow-hidden">
                    <div className="flex gap-4 p-4">
                      <button type="button" onClick={() => onOpenPro(pro.id, crew.map((item) => item.proId))} className="relative h-32 w-28 shrink-0 overflow-hidden rounded-2xl" aria-label={`Ouvrir ${pro.name}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pro.art} alt="" className="h-full w-full object-cover" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="kicker truncate text-white/70">{district?.name}</p>
                        <h2 className="title-2 truncate">{story.claims[pro.id]?.displayName || pro.name}</h2>
                        <p className="meta truncate">{pro.job}</p>
                        <p className="title-3 mt-1 tabular">{euro(entry.fee)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 px-4 pb-4">
                      <span className="chip chip-active">{STATUS_LABELS[entry.status]}</span>
                      <span className="chip"><Icon name="clock" size={16} /> {entry.time}</span>
                      <span className="chip"><Icon name="pin" size={16} /> {entry.place || district?.name}</span>
                    </div>

                    <div className="flex gap-2 border-t border-[rgba(255,255,255,0.1)] p-4">
                      <button
                        type="button"
                        onClick={() => {
                          haptic("tap");
                          setEditing(open ? null : pro.id);
                        }}
                        className="btn btn-ghost flex-1"
                      >
                        <Icon name="edit" size={20} /> {open ? "Fermer" : "Modifier"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          haptic("warn");
                          removePro(pro.id);
                        }}
                        className="icon-btn icon-btn-lg"
                        aria-label={`Retirer ${pro.name} de l'équipe`}
                      >
                        <Icon name="trash" size={22} />
                      </button>
                    </div>

                    {open && (
                      <div className="space-y-3 border-t border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-4">
                        <label className="block">
                          <span className="label">Statut</span>
                          <select className="field" value={entry.status} onChange={(event) => updateCrew(pro.id, { status: event.target.value as ProStatus })}>
                            {STATUS_ORDER.map((status) => (
                              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                            ))}
                          </select>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="block">
                            <span className="label">Montant</span>
                            <input type="number" inputMode="numeric" className="field tabular" value={entry.fee} onChange={(event) => updateCrew(pro.id, { fee: Number(event.target.value) })} />
                          </label>
                          <label className="block">
                            <span className="label">Acompte</span>
                            <input type="number" inputMode="numeric" className="field tabular" value={entry.deposit} onChange={(event) => updateCrew(pro.id, { deposit: Number(event.target.value) })} />
                          </label>
                          <label className="block">
                            <span className="label">Horaire</span>
                            <input className="field" value={entry.time} onChange={(event) => updateCrew(pro.id, { time: event.target.value })} />
                          </label>
                          <label className="block">
                            <span className="label">Lieu</span>
                            <input className="field" value={entry.place} onChange={(event) => updateCrew(pro.id, { place: event.target.value })} />
                          </label>
                        </div>
                        <label className="block">
                          <span className="label">Note privée</span>
                          <textarea className="field" value={entry.note} onChange={(event) => updateCrew(pro.id, { note: event.target.value })} />
                        </label>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {discovered.length > 0 && (
            <section className="glass p-4">
              <p className="kicker">Découverts par vos missions</p>
              <h2 className="title-2 mt-3">Statut : découvert</h2>
              <div className="mt-3 space-y-2">
                {discovered.map((id) => {
                  const pro = proById(id);
                  if (!pro) return null;
                  return (
                    <div key={id} className="flex items-center gap-3">
                      <button type="button" onClick={() => onOpenPro(pro.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={pro.art} alt="" className="h-full w-full object-cover opacity-85" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[1.0625rem] font-semibold">{pro.name}</span>
                          <span className="meta block truncate">{pro.job}</span>
                        </span>
                      </button>
                      <button type="button" onClick={() => addPro(pro.id, "to_contact")} className="icon-btn" aria-label={`Ajouter ${pro.name}`}>
                        <Icon name="plus" size={22} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {gaps.length > 0 && (
            <section className="glass p-4">
              <p className="kicker">ARIA · métiers manquants</p>
              <h2 className="title-2 mt-3">Angles morts de votre équipe</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {gaps.map((gap) => {
                  const candidate = gap.candidates[0];
                  return (
                    <div key={gap.job} className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.12)] p-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/40 text-white">
                        <Icon name="spark" size={22} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[1rem] font-semibold">{gap.job}</p>
                        <p className="meta truncate">{candidate ? `${candidate.name} · ${euro(candidate.fee)}` : "Aucun candidat"}</p>
                      </div>
                      {candidate && (
                        <button type="button" onClick={() => addPro(candidate.id, "to_contact")} className="icon-btn" aria-label={`Ajouter ${candidate.name}`}>
                          <Icon name="plus" size={22} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      <Sheet open={budgetOpen} onClose={() => setBudgetOpen(false)} kicker="Budget vivant" title="Le détail financier" footer={
        <button type="button" onClick={() => { setBudgetOpen(false); onNavigate("budget"); }} className="btn btn-lg btn-primary btn-block">
          Ouvrir le budget complet <Icon name="arrowRight" size={20} />
        </button>
      }>
        <div className="grid grid-cols-2 gap-3 p-6">
          {[
            { label: "Budget initial", value: euro(budget.initial) },
            { label: "Estimations", value: euro(budget.estimated) },
            { label: "Engagements confirmés", value: euro(budget.committed) },
            { label: "Acomptes versés", value: euro(budget.deposits) },
            { label: "Reste à payer", value: euro(budget.remaining) },
            { label: "Disponible", value: euro(budget.available), tone: "#ffffff" },
          ].map((item) => (
            <div key={item.label} className="glass-soft p-4">
              <p className="kicker">{item.label}</p>
              <p className="title-2 mt-1 tabular" style={item.tone ? { color: item.tone } : undefined}>{item.value}</p>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
