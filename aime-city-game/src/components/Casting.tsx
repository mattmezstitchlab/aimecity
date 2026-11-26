"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DISTRICTS, JOB_COLLECTION, MISSIONS, PROS, STATUS_LABELS, STATUS_ORDER } from "@/lib/data";
import { districtById, euro, proById } from "@/lib/engine";
import { usePrefs } from "@/lib/prefs";
import { useAime } from "@/lib/store";
import type { ClaimedCard, ProStatus } from "@/lib/types";
import { Icon, Progress, Segmented, Sheet } from "./ui";

/* ------------------------------------------------------------------ */
/* MODE PERSONNAGE — illustration plein écran, glissement horizontal   */
/* ------------------------------------------------------------------ */

export function CharacterViewer({
  ids,
  index,
  onIndex,
  onClose,
}: {
  ids: string[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const { story, addPro, removePro, replacePro, updateCrew, saveClaim, toast } = useAime();
  const { haptic, viewport } = usePrefs();
  const [drag, setDrag] = useState(0);
  const [panel, setPanel] = useState<"none" | "compare" | "claim">("none");
  const [compare, setCompare] = useState<string[]>([]);
  const [draft, setDraft] = useState<Partial<ClaimedCard>>({});
  const startX = useRef<number | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const pro = proById(ids[index] ?? "");
  const desktop = viewport.w >= 768;

  useEffect(() => {
    detailsRef.current?.scrollTo({ top: 0 });
  }, [pro?.id]);

  const go = (delta: number) => {
    if (!ids.length) return;
    haptic("soft");
    onIndex((index + delta + ids.length) % ids.length);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (panel === "none") onClose();
        else setPanel("none");
      }
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  });

  if (!story || !pro) return null;
  const entry = story.crew.find((item) => item.proId === pro.id);
  const claim = story.claims[pro.id];
  const district = districtById(pro.districtId);
  const linked = MISSIONS.filter((mission) => mission.revealProId === pro.id);
  const sameJob = PROS.filter((item) => item.job === pro.job && item.id !== pro.id);
  const alternatives = sameJob.length ? sameJob : PROS.filter((item) => item.districtId === pro.districtId && item.id !== pro.id);
  const compared = compare.includes(pro.id);

  const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    startX.current = event.clientX;
  };
  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    setDrag(event.clientX - startX.current);
  };
  const pointerUp = () => {
    if (startX.current === null) return;
    if (drag < -64) go(1);
    else if (drag > 64) go(-1);
    startX.current = null;
    setDrag(0);
  };

  const visual = (
    <div
      className="relative min-h-0 flex-1 touch-pan-y overflow-hidden md:h-full md:min-w-0"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={pro.id}
        src={pro.art}
        alt={`${pro.name}, ${pro.job}`}
        className="absolute inset-0 h-full w-full object-cover animate-kenburns"
        style={{ transform: `translateX(${drag * 0.25}px)` }}
        draggable={false}
      />
      <div className="absolute inset-0" style={{ background: `linear-gradient(170deg, rgba(0,0,0,0.45) 0%, transparent 32%, rgba(0,0,0,0.9) 88%)` }} />

      <div className="safe-t absolute inset-x-0 top-0 flex items-center justify-between gap-2 px-4 pt-3">
        <button type="button" onClick={onClose} className="icon-btn !border-[rgba(255,255,255,0.18)] !bg-black/60" aria-label="Revenir à la collection">
          <Icon name="close" size={24} />
        </button>
        <span className="rounded-full border border-[rgba(255,255,255,0.22)] bg-[rgba(0,0,0,0.75)] px-3 py-1.5 text-[0.875rem] font-semibold tabular backdrop-blur">
          {index + 1} / {ids.length}
        </span>
        <button
          type="button"
          onClick={() => {
            haptic("tap");
            setCompare((current) => (compared ? current.filter((id) => id !== pro.id) : [...current.slice(-2), pro.id]));
          }}
          className={`icon-btn bg-[rgba(0,0,0,0.75)] ${compared ? "icon-btn-active" : ""}`}
          aria-label="Ajouter au comparateur"
        >
          <Icon name="layers" size={22} />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
        <p className="kicker text-white/80">{district?.name}</p>
        <h2 className="title-1 mt-1">{claim?.displayName || pro.name}</h2>
        <p className="mt-1 text-[1.0625rem] font-semibold text-cream/80">{pro.job}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="chip">Personnage fictif</span>
          {entry && <span className="chip chip-active">{STATUS_LABELS[entry.status]}</span>}
          <span className="chip tabular">{euro(claim?.fee ?? pro.fee)} estimatifs</span>
        </div>
      </div>

      {!desktop && ids.length > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} className="icon-btn absolute left-3 top-1/2 -translate-y-1/2 bg-[rgba(0,0,0,0.6)]" aria-label="Personnage précédent">
            <Icon name="arrowLeft" size={22} />
          </button>
          <button type="button" onClick={() => go(1)} className="icon-btn absolute right-3 top-1/2 -translate-y-1/2 bg-[rgba(0,0,0,0.6)]" aria-label="Personnage suivant">
            <Icon name="arrowRight" size={22} />
          </button>
        </>
      )}
    </div>
  );

  const details = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-black">
      <div ref={detailsRef} data-testid="character-details-scroll" tabIndex={0} aria-label={`Informations et options pour ${pro.name}`} className="character-scroll min-h-0 flex-1 space-y-8 px-5 py-6 sm:px-7">
        <p className="text-[1.0625rem] leading-relaxed text-cream/85">{claim?.tagline || pro.signature}</p>
        <p className="text-[0.9375rem] leading-relaxed text-cream/60">{pro.bio}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="kicker">Compétences</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {pro.skills.map((skill) => (
                <span key={skill} className="chip">{skill}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="kicker">Prestations</p>
            <ul className="mt-2 space-y-1.5">
              {(claim?.services?.split("·") ?? pro.services).map((service) => (
                <li key={service} className="flex items-start gap-2 text-[0.9375rem] text-cream/75">
                  <Icon name="check" size={18} className="mt-0.5 shrink-0 text-white" /> {service}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {linked.length > 0 && (
          <div>
            <p className="kicker">Missions débloquées</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {linked.map((mission) => (
                <span key={mission.id} className={`chip ${story.missions[mission.id]?.done ? "chip-active" : ""}`}>
                  {mission.icon} {mission.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {entry && (
          <div className="glass-soft space-y-4 p-5">
            <p className="kicker">Équipe</p>
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
                <span className="label">Tarif</span>
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
            {alternatives.length > 0 && (
              <label className="block">
                <span className="label">Remplacer par</span>
                <select
                  className="field"
                  defaultValue=""
                  onChange={(event) => {
                    if (!event.target.value) return;
                    replacePro(pro.id, event.target.value);
                    haptic("success");
                    toast(`${pro.name} remplacé · budget recalculé`);
                  }}
                >
                  <option value="">Choisir un autre profil…</option>
                  {alternatives.map((alt) => (
                    <option key={alt.id} value={alt.id}>{alt.name} — {euro(alt.fee)}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPanel("claim")} className="btn btn-ghost">
            <Icon name="user" size={20} /> M&apos;approprier cette carte
          </button>
          {compare.length >= 2 && (
            <button type="button" onClick={() => setPanel("compare")} className="btn btn-ghost">
              <Icon name="layers" size={20} /> Comparer ({compare.length})
            </button>
          )}
        </div>

        <p className="text-[0.875rem] leading-relaxed text-cream/45">
          Tarifs fictifs · aucune réservation.
        </p>
      </div>

      <div className="safe-b flex shrink-0 items-center gap-2 border-t border-[rgba(255,255,255,0.14)] bg-black px-4 pt-3">
        <button type="button" onClick={() => go(-1)} className="icon-btn icon-btn-lg" aria-label="Personnage précédent">
          <Icon name="arrowLeft" size={24} />
        </button>
        {entry ? (
          <button
            type="button"
            onClick={() => {
              haptic("warn");
              removePro(pro.id);
              toast(`${pro.name} retiré de l'équipe`);
            }}
            className="btn btn-lg btn-danger min-w-0 flex-1 px-3"
          >
            <Icon name="minus" size={22} /> Retirer de l&apos;équipe
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              haptic("success");
              addPro(pro.id, "selected");
              toast(`${pro.name} rejoint l'équipe · ${euro(claim?.fee ?? pro.fee)} estimés`);
            }}
            className="btn btn-lg btn-light min-w-0 flex-1 px-3"
          >
            <Icon name="plus" size={22} className="shrink-0" /> Ajouter à mon équipe
          </button>
        )}
        <button type="button" onClick={() => go(1)} className="icon-btn icon-btn-lg" aria-label="Personnage suivant">
          <Icon name="arrowRight" size={24} />
        </button>
      </div>
    </div>
  );

  return createPortal(
    <div data-testid="character-viewer" className="fixed inset-0 z-[85] flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-black md:flex-row" role="dialog" aria-modal="true" aria-label={`${pro.name}, ${pro.job}`}>
      {visual}
      <div className="flex h-[52dvh] min-h-0 w-full shrink-0 flex-col overflow-hidden border-t border-[rgba(255,255,255,0.14)] md:h-full md:w-[min(46vw,580px)] md:border-l md:border-t-0">
        {details}
      </div>

      <Sheet open={panel === "compare"} onClose={() => setPanel("none")} kicker="Comparateur" title="Face à face" wide>
        <div className="space-y-3 p-5">
          {compare.map((id) => {
            const item = proById(id);
            if (!item) return null;
            const itemEntry = story.crew.find((crew) => crew.proId === id);
            return (
              <div key={id} className="glass-soft flex items-center gap-3 p-3">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.art} alt="" className="h-full w-full object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="title-3 truncate">{item.name}</p>
                  <p className="meta truncate">{item.job} · {districtById(item.districtId)?.name}</p>
                  <p className="meta truncate text-cream/50">{item.services[0]}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="title-3 tabular">{euro(story.claims[id]?.fee ?? item.fee)}</p>
                  {itemEntry ? (
                    <span className="meta text-white">Dans l&apos;équipe</span>
                  ) : (
                    <button type="button" onClick={() => addPro(id)} className="btn btn-primary mt-1 min-h-[44px] px-4 text-[0.875rem]">Choisir</button>
                  )}
                </div>
              </div>
            );
          })}
          <button type="button" onClick={() => setCompare([])} className="btn btn-ghost btn-block">Vider le comparateur</button>
        </div>
      </Sheet>

      <Sheet open={panel === "claim"} onClose={() => setPanel("none")} kicker="Professionnel" title="M'approprier cette carte">
        <div className="space-y-3 p-5">
          <p className="text-[0.9375rem] leading-relaxed text-cream/60">
            Personnalisez votre carte. Tout reste local.
          </p>
          <label className="block">
            <span className="label">Nom affiché</span>
            <input className="field" defaultValue={claim?.displayName ?? pro.name} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} />
          </label>
          <label className="block">
            <span className="label">Signature</span>
            <input className="field" defaultValue={claim?.tagline ?? pro.signature} onChange={(event) => setDraft({ ...draft, tagline: event.target.value })} />
          </label>
          <label className="block">
            <span className="label">Prestations</span>
            <input className="field" defaultValue={claim?.services ?? pro.services.join(" · ")} onChange={(event) => setDraft({ ...draft, services: event.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Email</span>
              <input className="field" inputMode="email" defaultValue={claim?.contact ?? ""} onChange={(event) => setDraft({ ...draft, contact: event.target.value })} />
            </label>
            <label className="block">
              <span className="label">Téléphone</span>
              <input className="field" inputMode="tel" defaultValue={claim?.phone ?? ""} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
            </label>
            <label className="block">
              <span className="label">Site</span>
              <input className="field" defaultValue={claim?.website ?? ""} onChange={(event) => setDraft({ ...draft, website: event.target.value })} />
            </label>
            <label className="block">
              <span className="label">Tarif</span>
              <input type="number" inputMode="numeric" className="field tabular" defaultValue={claim?.fee ?? pro.fee} onChange={(event) => setDraft({ ...draft, fee: Number(event.target.value) })} />
            </label>
          </div>
          <button
            type="button"
            onClick={() => {
              saveClaim(pro.id, {
                displayName: draft.displayName ?? claim?.displayName ?? pro.name,
                tagline: draft.tagline ?? claim?.tagline ?? pro.signature,
                services: draft.services ?? claim?.services ?? pro.services.join(" · "),
                contact: draft.contact ?? claim?.contact ?? "",
                phone: draft.phone ?? claim?.phone ?? "",
                website: draft.website ?? claim?.website ?? "",
                fee: draft.fee ?? claim?.fee ?? pro.fee,
              });
              if (entry) updateCrew(pro.id, { fee: draft.fee ?? claim?.fee ?? pro.fee });
              haptic("success");
              toast("Carte personnalisée et enregistrée localement");
              setPanel("none");
            }}
            className="btn btn-lg btn-primary btn-block"
          >
            Enregistrer ma carte
          </button>
        </div>
      </Sheet>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* MODE COLLECTION — mosaïque de grandes cartes                        */
/* ------------------------------------------------------------------ */

export default function Casting() {
  const { story, addPro, removePro } = useAime();
  const { haptic } = usePrefs();
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("all");
  const [onlyCrew, setOnlyCrew] = useState(false);
  const [collection, setCollection] = useState(false);
  const [mode, setMode] = useState<"collection" | "personnage">("collection");
  const [index, setIndex] = useState(0);

  const filtered = useMemo(() => {
    if (!story) return [];
    const crew = new Set(story.crew.map((entry) => entry.proId));
    return PROS.filter((pro) => {
      if (district !== "all" && pro.districtId !== district) return false;
      if (onlyCrew && !crew.has(pro.id)) return false;
      if (!query.trim()) return true;
      const haystack = `${pro.name} ${pro.job} ${pro.skills.join(" ")} ${districtById(pro.districtId)?.name}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });
  }, [story, district, onlyCrew, query]);

  if (!story) return null;
  const ids = filtered.map((pro) => pro.id);
  const openAt = (position: number) => {
    haptic("tap");
    setIndex(Math.max(0, Math.min(position, ids.length - 1)));
    setMode("personnage");
  };

  return (
    <div className="space-y-4">
      <section className="section first:border-t-0 first:pt-0">
        <h1 className="title-1 mt-4">Choisissez votre équipe</h1>
      </section>

      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Rechercher un personnage ou un métier</span>
          <Icon name="search" size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cream/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Saxophoniste, photographe…"
            className="field pl-12"
            enterKeyHint="search"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            haptic("tap");
            setOnlyCrew((value) => !value);
          }}
          className={`icon-btn icon-btn-lg ${onlyCrew ? "icon-btn-active" : ""}`}
          aria-pressed={onlyCrew}
          aria-label="Afficher uniquement mon équipe"
        >
          <Icon name="crew" size={24} />
        </button>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <button type="button" onClick={() => setDistrict("all")} className={`chip shrink-0 ${district === "all" ? "chip-active" : ""}`}>
          Tous
        </button>
        {DISTRICTS.map((item) => (
          <button key={item.id} type="button" onClick={() => setDistrict(item.id)} className={`chip shrink-0 ${district === item.id ? "chip-active" : ""}`}>
            <span className="h-2.5 w-2.5 rounded-full bg-white/70" />
            {item.name}
          </button>
        ))}
      </div>

      <Segmented
        ariaLabel="Mode d'affichage du casting"
        value={mode}
        onChange={(next) => {
          if (next === "personnage") openAt(0);
          else setMode("collection");
        }}
        options={[
          { id: "collection", label: "Collection", icon: "grid" },
          { id: "personnage", label: "Personnage", icon: "portrait" },
        ]}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="meta">{filtered.length} personnages</p>
        <button type="button" onClick={() => setCollection(true)} className="chip">
          <Icon name="layers" size={18} /> 113 métiers
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {filtered.map((pro, position) => {
          const selected = story.crew.some((entry) => entry.proId === pro.id);
          return (
            <article key={pro.id} className="group relative overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.12)] bg-[#0a0a0a]">
              <button type="button" onClick={() => openAt(position)} className="block w-full text-left" aria-label={`Ouvrir ${pro.name}, ${pro.job}`}>
                <div className="relative aspect-[3/4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pro.art} alt={`${pro.name}, ${pro.job}`} loading={position < 6 ? "eager" : "lazy"} className="h-full w-full object-cover" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.86) 86%)` }} />
                  {selected && (
                    <span className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white text-black">
                      <Icon name="check" size={22} strokeWidth={2.4} />
                    </span>
                  )}
                  <div className="absolute inset-x-3 bottom-3">
                    <h2 className="font-display text-[1.25rem] leading-tight">{pro.name}</h2>
                    <p className="mt-0.5 text-[0.9375rem] font-semibold text-cream/75">{pro.job}</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic(selected ? "soft" : "success");
                  if (selected) removePro(pro.id);
                  else addPro(pro.id);
                }}
                className={`flex min-h-[52px] w-full items-center justify-center gap-2 border-t border-white/10 text-[0.9375rem] font-semibold ${
                  selected ? "bg-white/10 text-white" : "bg-white text-black hover:bg-neutral-200"
                }`}
              >
                <Icon name={selected ? "check" : "plus"} size={20} />
                {selected ? "Sélectionné" : "Sélectionner"}
              </button>
            </article>
          );
        })}
      </div>

      {!filtered.length && (
        <p className="glass-soft p-6 text-center text-[1rem] text-cream/65">
          Aucun personnage trouvé.
        </p>
      )}

      {mode === "personnage" && ids.length > 0 && (
        <CharacterViewer
          ids={ids}
          index={Math.min(index, ids.length - 1)}
          onIndex={setIndex}
          onClose={() => setMode("collection")}
        />
      )}

      <Sheet open={collection} onClose={() => setCollection(false)} kicker="Collection extensible" title="113 métiers du monde" wide>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <Progress value={(PROS.length / JOB_COLLECTION.length) * 100} />
            <span className="shrink-0 text-[0.9375rem] tabular text-cream/65">{PROS.length}/{JOB_COLLECTION.length}</span>
          </div>
          {DISTRICTS.map((item) => {
            const jobs = JOB_COLLECTION.filter((job) => job.districtId === item.id);
            const illustrated = PROS.filter((pro) => pro.districtId === item.id);
            return (
              <div key={item.id} className="glass-soft p-4">
                <p className="title-3 text-white">{item.name}</p>
                <p className="meta mt-0.5">{illustrated.length} illustrés sur {jobs.length} métiers</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {jobs.map((job) => {
                    const character = illustrated.find((pro) => pro.job === job.label);
                    return (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => {
                          if (character) {
                            setCollection(false);
                            openAt(ids.indexOf(character.id) >= 0 ? ids.indexOf(character.id) : 0);
                          } else {
                            setCollection(false);
                            setDistrict(item.id);
                          }
                        }}
                        className={`chip ${character ? "chip-active" : ""}`}
                      >
                        {job.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
