"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ART, PHOTO_CHOICES } from "@/lib/data";
import { buildPublicSite, buildSiteHtml, formatDate, uid } from "@/lib/engine";
import { usePrefs } from "@/lib/prefs";
import { useAime } from "@/lib/store";
import type { PublicSite, ViewId } from "@/lib/types";
import { Icon, SectionTitle, Segmented } from "./ui";

type Tab = "cinema" | "minisite" | "invites";

function Trailer({ site, open, onClose, photos }: { site: PublicSite; open: boolean; onClose: () => void; photos: { src: string; caption: string }[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const scenes = useMemo(
    () => [
      { kicker: "AIME® CITY présente", title: site.couple, sub: `${formatDate(site.date)} · ${site.place}`, image: ART.hero },
      { kicker: "Un monde à construire", title: site.cityName || "AIME® CITY", sub: "Love is an open world", image: ART.city },
      { kicker: "Avec leur équipe", title: site.team.slice(0, 2).map((m) => m.name).join(" · ") || "Leur équipe", sub: site.team.slice(0, 3).map((m) => m.job).join(" · ") || "24 personnages", image: ART.music },
      { kicker: "Le lieu", title: site.place || "Le lieu du oui", sub: `${site.guests} invités · ${site.headline}`, image: ART.ceremony },
      { kicker: "Le jour J", title: site.program[1]?.title || "La cérémonie", sub: site.program.slice(0, 3).map((i) => `${i.start} ${i.title}`).join(" · "), image: ART.gourmet },
      { kicker: photos.length ? "Souvenirs" : "À venir", title: photos[0] ? "Vos images" : "Votre histoire", sub: photos[0]?.caption || "Un film personnalisé par vos choix", image: photos[0]?.src || ART.night },
      { kicker: "Rendez-vous le", title: formatDate(site.date), sub: "AIME® CITY · Love is an open world", image: ART.hero },
    ],
    [site, photos],
  );

  useEffect(() => {
    if (!open) {
      setIndex(0);
      setPlaying(true);
      return;
    }
    if (!playing) return;
    const timer = setTimeout(() => setIndex((value) => (value + 1) % scenes.length), 4200);
    return () => clearTimeout(timer);
  }, [open, playing, index, scenes.length]);

  if (!open) return null;
  const scene = scenes[Math.min(index, scenes.length - 1)];

  return (
    <div className="fixed inset-0 z-[95] bg-noir">
      <div className="relative h-full w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={scene.image + index} src={scene.image} alt="" className="absolute inset-0 h-full w-full object-cover animate-kenburns" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.6),rgba(0,0,0,0.25)_45%,rgba(0,0,0,0.94))]" />
        <div className="safe-t absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-4 pt-3">
          <span className="kicker">Bande-annonce personnalisée</span>
          <button type="button" onClick={onClose} className="icon-btn icon-btn-lg bg-[rgba(0,0,0,0.7)]" aria-label="Fermer la bande-annonce">
            <Icon name="close" size={26} />
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-5 pb-28 sm:px-10">
          <p className="kicker text-white">{scene.kicker}</p>
          <h2 className="title-hero mt-2" style={{ fontSize: "clamp(2.25rem,8vw,5rem)" }}>{scene.title}</h2>
          <p className="mt-2 max-w-xl text-[1.0625rem] text-cream/80">{scene.sub}</p>
        </div>
        <div className="safe-b absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 pt-3">
          <div className="flex gap-1.5">
            {scenes.map((_, dot) => (
              <button key={dot} type="button" onClick={() => setIndex(dot)} aria-label={`Scène ${dot + 1}`} className={`h-2 rounded-full transition-all ${dot === index ? "w-8 bg-white" : "w-2 bg-cream/35"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setIndex((value) => (value - 1 + scenes.length) % scenes.length)} className="icon-btn icon-btn-lg bg-[rgba(0,0,0,0.7)]" aria-label="Scène précédente">
              <Icon name="arrowLeft" size={24} />
            </button>
            <button type="button" onClick={() => setPlaying((value) => !value)} className="btn btn-lg btn-primary">
              <Icon name={playing ? "pause" : "play"} size={22} /> {playing ? "Pause" : "Lire"}
            </button>
            <button type="button" onClick={() => setIndex((value) => (value + 1) % scenes.length)} className="icon-btn icon-btn-lg bg-[rgba(0,0,0,0.7)]" aria-label="Scène suivante">
              <Icon name="arrowRight" size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Studio({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const { story, updateMiniSite, addPhoto, removePhoto, toggleMission, setPublishedCode, updateWedding, toast } = useAime();
  const { haptic } = usePrefs();
  const [tab, setTab] = useState<Tab>("cinema");
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [photoPick, setPhotoPick] = useState(ART.ceremony);
  const [photoCaption, setPhotoCaption] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const site = useMemo(() => (story ? buildPublicSite(story) : null), [story]);
  const html = useMemo(() => (site ? buildSiteHtml(site, baseUrl) : ""), [site, baseUrl]);

  if (!story || !site) return null;
  const finalMissionDone = Boolean(story.missions.m24?.done);
  const published = story.publishedCode;
  const guestUrl = published ? `${baseUrl}/s/${published}` : "";

  const importPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        let src = String(reader.result);
        if (context) {
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          src = canvas.toDataURL("image/jpeg", 0.82);
        }
        addPhoto({ id: uid("photo"), src, caption: photoCaption || "Souvenir importé" });
        setPhotoCaption("");
        haptic("success");
        toast("Photo importée · compressée et stockée localement");
      };
      image.onerror = () => toast("Cette image n'a pas pu être lue");
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: site, code: published ?? undefined }),
      });
      if (!response.ok) throw new Error("publish failed");
      const data = (await response.json()) as { code: string };
      setPublishedCode(data.code);
      haptic("success");
      toast(`Mini-site publié · code ${data.code}`);
    } catch {
      toast("Publication indisponible : exportez le HTML à la place.");
    } finally {
      setPublishing(false);
    }
  };

  const download = () => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aime-city-${(story.wedding.partnerA || "couple").toLowerCase()}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast("Export HTML téléchargé");
  };

  return (
    <div className="space-y-4">
      <SectionTitle kicker="Studio" title="Cinéma, mini-site & invités" />

      <Segmented
        ariaLabel="Sections du studio"
        value={tab}
        onChange={setTab}
        options={[
          { id: "cinema", label: "Cinéma", icon: "studio" },
          { id: "minisite", label: "Mini-site", icon: "layers" },
          { id: "invites", label: "Invités", icon: "users" },
        ]}
      />

      {tab === "cinema" && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.16)]">
            <div className="relative aspect-[4/5] sm:aspect-[21/9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ART.hero} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.95))]" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <p className="kicker text-white">Bande-annonce personnalisée</p>
                <h2 className="title-1 mt-1">
                  {story.wedding.partnerA || "Vous"} <span className="text-white">&amp;</span> {story.wedding.partnerB || "…"}
                </h2>
                <p className="meta mt-1">{formatDate(story.wedding.date)} · {story.wedding.place || "lieu à confirmer"}</p>
                <button type="button" onClick={() => { haptic("tap"); setTrailerOpen(true); }} className="btn btn-lg btn-primary mt-4">
                  <Icon name="play" size={22} /> Lancer la bande-annonce
                </button>
              </div>
            </div>
          </div>

          <div className="glass space-y-4 p-6">
            <p className="kicker">Générique</p>
            <label className="block">
              <span className="label">Titre du film</span>
              <input className="field" value={story.miniSite.headline} onChange={(event) => updateMiniSite({ headline: event.target.value })} />
            </label>
            <label className="block">
              <span className="label">Accroche</span>
              <textarea className="field" value={story.miniSite.welcome} onChange={(event) => updateMiniSite({ welcome: event.target.value })} />
            </label>
            <label className="block">
              <span className="label">Lieu</span>
              <input className="field" value={story.wedding.place} onChange={(event) => updateWedding({ place: event.target.value })} />
            </label>
          </div>

          <Trailer site={site} open={trailerOpen} onClose={() => setTrailerOpen(false)} photos={site.photos} />
        </div>
      )}

      {tab === "minisite" && (
        <div className="space-y-3">
          <div className="glass p-6">
            <p className="kicker">Style du mini-site</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(["classic", "city"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateMiniSite({ style })}
                  className={`rounded-2xl border p-4 text-left ${story.miniSite.style === style ? "border-white bg-[rgba(255,255,255,0.14)]" : "border-[rgba(255,255,255,0.14)]"}`}
                >
                  <span className="title-3 block">{style === "classic" ? "Classic" : "City"}</span>
                  <span className="meta block">{style === "classic" ? "Romantique, minimaliste" : "Immersif, cinéma"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass space-y-4 p-6">
            <p className="kicker">Contenus</p>
            <label className="block">
              <span className="label">Mot de bienvenue</span>
              <textarea className="field" value={story.miniSite.welcome} onChange={(event) => updateMiniSite({ welcome: event.target.value })} />
            </label>
            <label className="block">
              <span className="label">Informations pratiques</span>
              <textarea className="field" value={story.miniSite.practical} onChange={(event) => updateMiniSite({ practical: event.target.value })} />
            </label>
            <label className="block">
              <span className="label">Dress code</span>
              <input className="field" value={story.miniSite.dressCode} onChange={(event) => updateMiniSite({ dressCode: event.target.value })} />
            </label>
          </div>

          <div className="glass space-y-4 p-6">
            <p className="kicker">Souvenirs · {story.photos.length}</p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {PHOTO_CHOICES.map((choice) => (
                <button
                  key={choice.key}
                  type="button"
                  onClick={() => setPhotoPick(choice.src)}
                  className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 ${photoPick === choice.src ? "border-white" : "border-transparent"}`}
                  aria-label={`Choisir l'illustration ${choice.key}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={choice.src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <input className="field" placeholder="Légende du souvenir" value={photoCaption} onChange={(event) => setPhotoCaption(event.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { addPhoto({ id: uid("photo"), src: photoPick, caption: photoCaption || "Un souvenir d'AIME® CITY" }); setPhotoCaption(""); toast("Souvenir ajouté"); }} className="btn btn-ghost">
                <Icon name="camera" size={20} /> Illustration
              </button>
              <button type="button" onClick={() => fileInput.current?.click()} className="btn btn-ghost">
                <Icon name="import" size={20} /> Ma photo
              </button>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) importPhoto(file); event.target.value = ""; }} />
            </div>
            {story.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {story.photos.map((photo) => (
                  <div key={photo.id} className="relative overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.src} alt={photo.caption} className="h-24 w-full object-cover" />
                    <button type="button" onClick={() => removePhoto(photo.id)} className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-[rgba(0,0,0,0.8)]" aria-label="Retirer le souvenir">
                      <Icon name="close" size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <p className="kicker border-b border-[rgba(255,255,255,0.1)] p-4">Aperçu · {story.miniSite.style}</p>
            <iframe title="Aperçu du mini-site" srcDoc={html} className="h-[520px] w-full bg-noir" sandbox="allow-same-origin allow-popups" />
          </div>

          <div className="glass space-y-4 p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="kicker">Publier &amp; partager</p>
              <span className={`chip ${finalMissionDone ? "chip-active" : ""}`}>{finalMissionDone ? "Mission 24 accomplie" : "Mission 24 requise"}</span>
            </div>
            {!finalMissionDone && (
              <button type="button" onClick={() => { toggleMission("m24"); haptic("success"); toast("Mission 24 accomplie · mini-site généré"); }} className="btn btn-lg btn-primary btn-block">
                <Icon name="spark" size={22} /> Accomplir « Ouvrir le monde »
              </button>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={publish} disabled={publishing} className="btn btn-primary">
                <Icon name="share" size={20} /> {publishing ? "Publication…" : published ? "Mettre à jour" : "Publier"}
              </button>
              <button type="button" onClick={download} className="btn btn-ghost">
                <Icon name="download" size={20} /> Exporter HTML
              </button>
              {guestUrl && (
                <>
                  <a href={guestUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">
                    <Icon name="external" size={20} /> Page invités
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(guestUrl);
                        toast("Lien de partage copié");
                      } catch {
                        toast(guestUrl);
                      }
                    }}
                    className="btn btn-ghost"
                  >
                    <Icon name="share" size={20} /> Copier le lien
                  </button>
                </>
              )}
            </div>
            <p className="meta text-cream/45">La page publiée ne contient aucune donnée financière. {published ? `Code : ${published}.` : ""}</p>
          </div>
        </div>
      )}

      {tab === "invites" && <GuestPreviewCard onNavigate={onNavigate} />}
    </div>
  );
}

export function GuestPreviewCard({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const { story, addRsvp, toast } = useAime();
  const { haptic } = usePrefs();
  const [form, setForm] = useState({ name: "", attending: true, count: 1, song: "", message: "" });
  if (!story) return null;
  const site = buildPublicSite(story);

  return (
    <div className="space-y-3">
      <div className="card p-6">
        <p className="kicker text-white">Aperçu invité · données publiques</p>
        <h2 className="title-1 mt-1">{site.couple}</h2>
        <p className="meta mt-1">{formatDate(site.date)} · {site.place}</p>
        <p className="mt-3 text-[1rem] leading-relaxed text-cream/80">{site.welcome}</p>

        <div className="mt-4 space-y-2">
          <p className="kicker">Programme</p>
          {site.program.map((item) => (
            <div key={`${item.title}-${item.start}`} className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.12)] p-3">
              <span className="title-3 w-14 shrink-0 tabular text-white">{item.start}</span>
              <span className="text-[1.25rem]">{item.icon}</span>
              <span className="min-w-0">
                <span className="block truncate text-[1rem] font-semibold">{item.title}</span>
                <span className="meta block truncate">{item.place}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <p className="kicker">Informations</p>
          <p className="text-[0.9375rem] leading-relaxed text-cream/70">{site.practical}</p>
          <p className="text-[0.9375rem] text-cream/60">{site.dressCode}</p>
        </div>

        {site.music.length > 0 && (
          <div className="mt-4">
            <p className="kicker">Suggestions musicales</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {site.music.map((item) => (
                <a key={item.name} href={item.url} target="_blank" rel="noreferrer" className="chip">
                  <Icon name="music" size={18} /> {item.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass space-y-4 p-6">
        <p className="kicker">RSVP · démonstration locale</p>
        <input className="field" placeholder="Votre nom" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <div className="flex gap-2">
          <button type="button" onClick={() => setForm({ ...form, attending: true })} className={`chip flex-1 justify-center ${form.attending ? "chip-active" : ""}`}>Je serai là</button>
          <button type="button" onClick={() => setForm({ ...form, attending: false })} className={`chip flex-1 justify-center ${!form.attending ? "chip-active" : ""}`}>Je ne peux pas</button>
        </div>
        <input type="number" inputMode="numeric" min={1} max={8} className="field tabular" value={form.count} onChange={(event) => setForm({ ...form, count: Number(event.target.value) })} />
        <input className="field" placeholder="Un titre à passer au DJ ?" value={form.song} onChange={(event) => setForm({ ...form, song: event.target.value })} />
        <textarea className="field" placeholder="Un mot pour les mariés…" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
        <button
          type="button"
          disabled={!form.name.trim()}
          onClick={() => {
            addRsvp({ id: uid("rsvp"), name: form.name, attending: form.attending, count: form.count, song: form.song, message: form.message, at: new Date().toISOString() });
            setForm({ name: "", attending: true, count: 1, song: "", message: "" });
            haptic("success");
            toast("RSVP enregistré localement");
          }}
          className="btn btn-lg btn-primary btn-block"
        >
          <Icon name="send" size={22} /> Envoyer le RSVP
        </button>
      </div>

      <div className="glass p-6">
        <div className="flex items-center justify-between">
          <p className="kicker">Réponses locales</p>
          <span className="meta">{story.rsvps.length}</span>
        </div>
        <div className="mt-2 space-y-2">
          {story.rsvps.map((rsvp) => (
            <div key={rsvp.id} className="rounded-2xl border border-[rgba(255,255,255,0.12)] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[1rem] font-semibold">{rsvp.name}</span>
                <span className="text-[0.9375rem] text-white/85">{rsvp.attending ? `${rsvp.count} pers.` : "absent"}</span>
              </div>
              {rsvp.song && <p className="meta">♪ {rsvp.song}</p>}
              {rsvp.message && <p className="meta text-cream/50">{rsvp.message}</p>}
            </div>
          ))}
          {!story.rsvps.length && <p className="meta">Aucune réponse pour l&apos;instant.</p>}
        </div>
        <button type="button" onClick={() => onNavigate("monde")} className="btn btn-ghost btn-block mt-3">Retour au monde</button>
      </div>
    </div>
  );
}
