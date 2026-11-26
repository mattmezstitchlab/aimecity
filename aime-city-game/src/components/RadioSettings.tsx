"use client";

import { useRef, useState } from "react";
import { PROS, RADIO_STATIONS } from "@/lib/data";
import { daysUntil, euro, formatDate, progressPercent } from "@/lib/engine";
import { usePrefs } from "@/lib/prefs";
import { useAime } from "@/lib/store";
import { Icon, SectionTitle, Sheet } from "./ui";

export function RadioView() {
  const { story, setRadioLink, toast } = useAime();
  const { haptic } = usePrefs();
  if (!story) return null;

  return (
    <div className="space-y-4">
      <SectionTitle
        kicker="AIME® RADIO · sept univers"
        title="La bande-son du monde"
        subtitle="Aucun son ne se lance automatiquement et aucun contenu audio n'est hébergé. Associez vos liens Spotify ou Apple Music aux moments du mariage."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {RADIO_STATIONS.map((station) => {
          const link = story.radio.find((item) => item.stationId === station.id);
          return (
            <article key={station.id} className="card overflow-hidden">
              <div className="relative h-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={station.art} alt="" loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.25),rgba(0,0,0,0.95))]" />
                <div className="absolute inset-x-4 bottom-3">
                  <h2 className="title-2">{station.name}</h2>
                  <p className="meta">{station.mood}</p>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <p className="text-[0.9375rem] leading-relaxed text-cream/70">{station.description}</p>
                <div className="flex flex-wrap gap-2">
                  {station.accents.map((accent) => (
                    <span key={accent} className="chip">{accent}</span>
                  ))}
                </div>
                <label className="block">
                  <span className="label">Moment associé</span>
                  <select className="field" value={link?.moment ?? station.moment} onChange={(event) => setRadioLink(station.id, { moment: event.target.value })}>
                    {[...new Set([station.moment, ...story.events.map((event) => event.title), "Préparatifs", "Brunch"])].map((moment) => (
                      <option key={moment} value={moment}>{moment}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Lien Spotify / Apple Music</span>
                  <input
                    className="field"
                    inputMode="url"
                    value={link?.url ?? ""}
                    placeholder="https://open.spotify.com/…"
                    onChange={(event) => setRadioLink(station.id, { url: event.target.value })}
                  />
                </label>
                <div className="flex gap-2">
                  <a
                    href={link?.url || `https://open.spotify.com/search/${encodeURIComponent(station.search)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost flex-1"
                  >
                    <Icon name="external" size={20} /> Ouvrir
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(link?.url ?? "");
                        haptic("success");
                        toast("Lien copié");
                      } catch {
                        toast("Copie indisponible sur ce navigateur");
                      }
                    }}
                    className="icon-btn icon-btn-lg"
                    aria-label={`Copier le lien ${station.name}`}
                  >
                    <Icon name="share" size={22} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="glass p-4">
        <p className="kicker">Playlist du jour</p>
        <div className="mt-3 space-y-2">
          {story.radio.map((link) => {
            const station = RADIO_STATIONS.find((item) => item.id === link.stationId);
            return (
              <div key={link.stationId} className="flex items-center justify-between gap-3 rounded-2xl border border-[rgba(255,255,255,0.12)] p-3">
                <span className="min-w-0 truncate text-[1rem] text-cream/80">{link.moment}</span>
                <span className="meta shrink-0">{station?.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, hint, value, onChange, icon }: { label: string; hint: string; value: boolean; onChange: (next: boolean) => void; icon: Parameters<typeof Icon>[0]["name"] }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="flex w-full items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.12)] p-4 text-left" aria-pressed={value}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[rgba(255,255,255,0.16)] text-white">
        <Icon name={icon} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[1.0625rem] font-semibold">{label}</span>
        <span className="meta block">{hint}</span>
      </span>
      <span className="switch" data-on={value} />
    </button>
  );
}

export function SettingsView() {
  const { story, saveStatus, exportJson, importJson, resetWorld, startDemo, quitToLanding, toast, hydrated } = useAime();
  const { reduceMotion, haptics, silent, orientation, set, haptic, viewport, consoleMode } = usePrefs();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState("");

  if (!story) return null;
  const exported = exportJson();
  const sizeKb = new Blob([exported]).size / 1024;

  const download = () => {
    const blob = new Blob([exported], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aime-city-${story.wedding.partnerA || "partie"}-${story.wedding.partnerB || ""}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    haptic("success");
    toast("Sauvegarde JSON exportée");
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        kicker="Réglages & sauvegarde"
        title="Votre monde reste le vôtre"
        subtitle="Sauvegarde locale automatique (IndexedDB + localStorage), export/import JSON, réinitialisation confirmée. Aucun compte, aucun serveur obligatoire."
        right={<span className="chip">{saveStatus === "saving" ? "Sauvegarde…" : hydrated ? "Sauvegardé" : "Chargement"}</span>}
      />

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Couple", value: `${story.wedding.partnerA} & ${story.wedding.partnerB}`, hint: story.wedding.cityName },
          { label: "Date", value: formatDate(story.wedding.date), hint: `J-${daysUntil(story.wedding.date) ?? "?"}` },
          { label: "Progression", value: `${progressPercent(story)}%`, hint: `${story.crew.length} personnages` },
          { label: "Enveloppe", value: euro(story.wedding.budget), hint: `${sizeKb.toFixed(0)} Ko sauvegardés` },
        ].map((item) => (
          <div key={item.label} className="glass-soft p-4">
            <p className="kicker">{item.label}</p>
            <p className="title-3 mt-1 truncate">{item.value}</p>
            <p className="meta mt-0.5 truncate text-cream/45">{item.hint}</p>
          </div>
        ))}
      </div>

      <section className="space-y-2.5">
        <p className="kicker">Confort de jeu</p>
        <Toggle icon="motion" label="Réduire les animations" hint="Transitions instantanées, économie de batterie" value={reduceMotion} onChange={(next) => set({ reduceMotion: next })} />
        <Toggle icon="vibrate" label="Retour haptique" hint="Vibrations légères si le navigateur le permet" value={haptics} onChange={(next) => { set({ haptics: next }); if (next) haptic("success"); }} />
        <Toggle icon="radio" label="Mode silencieux" hint="Coupe la lecture vocale des réponses d'ARIA" value={silent} onChange={(next) => set({ silent: next })} />
        <div className="glass-soft p-5">
          <p className="text-[1.0625rem] font-semibold">Orientation de l&apos;interface</p>
          <p className="meta mt-0.5">
            Détection automatique ({viewport.orientation === "portrait" ? "portrait" : "paysage"} · {viewport.w}×{viewport.h}) — {consoleMode ? "mode console actif" : "mode portrait actif"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["auto", "portrait", "landscape"] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => set({ orientation: mode })} className={`chip ${orientation === mode ? "chip-active" : ""}`}>
                <Icon name={mode === "landscape" ? "grid" : mode === "portrait" ? "portrait" : "target"} size={18} />
                {mode === "auto" ? "Automatique" : mode === "portrait" ? "Portrait" : "Paysage console"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-2.5">
        <p className="kicker">Sauvegarde</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={download} className="btn btn-primary flex-1">
            <Icon name="download" size={20} /> Exporter JSON
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost flex-1">
            <Icon name="import" size={20} /> Importer
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const ok = importJson(text);
              setImportError(ok ? "" : "Fichier illisible ou format non reconnu.");
              if (ok) toast("Monde restauré");
              event.target.value = "";
            }}
          />
        </div>
        {importError && <p className="text-[0.9375rem] text-white">{importError}</p>}
        <p className="meta">Dernière mise à jour : {new Date(story.updatedAt).toLocaleString("fr-FR")}</p>
      </section>

      <section className="space-y-2.5">
        <p className="kicker">Parties</p>
        <button type="button" onClick={() => { startDemo(); toast("Démonstration rechargée"); }} className="btn btn-ghost btn-block">
          Charger la démo Camille &amp; Gabriel
        </button>
        <button type="button" onClick={() => quitToLanding()} className="btn btn-ghost btn-block">
          Retour à l&apos;accueil
        </button>
        <button type="button" onClick={() => setConfirmReset(true)} className="btn btn-danger btn-block">
          <Icon name="reset" size={20} /> Réinitialiser le monde
        </button>
      </section>

      <section className="glass p-4">
        <p className="kicker">Règles du monde</p>
        <ul className="mt-2 space-y-1.5 text-[0.9375rem] leading-relaxed text-cream/65">
          <li>• Les {PROS.length} personnages et les 113 métiers prévus sont fictifs.</li>
          <li>• Tarifs, acomptes et disponibilités sont des simulations, jamais des engagements réels.</li>
          <li>• Aucune réservation, aucun paiement, aucun compte obligatoire.</li>
          <li>• ARIA prépare des messages mais ne les envoie pas.</li>
          <li>• Le mini-site publié ne contient aucune donnée financière privée.</li>
        </ul>
      </section>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        kicker="Confirmation"
        title="Réinitialiser votre monde ?"
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmReset(false)} className="btn btn-lg btn-ghost flex-1">Annuler</button>
            <button
              type="button"
              onClick={() => {
                resetWorld();
                setConfirmReset(false);
              }}
              className="btn btn-lg btn-primary flex-1"
            >
              Tout effacer
            </button>
          </div>
        }
      >
        <p className="p-5 text-[1rem] leading-relaxed text-cream/75">
          Cette action efface définitivement la sauvegarde locale : {story.crew.length} personnages, {story.photos.length} souvenirs et
          toutes les missions. Exportez d&apos;abord si vous souhaitez conserver votre histoire.
        </p>
      </Sheet>
    </div>
  );
}
