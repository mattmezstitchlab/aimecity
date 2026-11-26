import {
  COMPLEMENTS,
  MISSIONS,
  PROS,
  RADIO_STATIONS,
  REQUIRED_JOBS,
  DISTRICTS,
  TOTAL_MISSIONS,
} from "./data";
import type { CrewEntry, DayEvent, Pro, PublicSite, StoryState } from "./types";

export const euro = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0,
  );

export const formatDate = (iso: string, opts?: Intl.DateTimeFormatOptions) => {
  if (!iso) return "Date à définir";
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Date à définir";
  return new Intl.DateTimeFormat("fr-FR", opts ?? { day: "numeric", month: "long", year: "numeric" }).format(date);
};

export const shortDate = (iso: string) => formatDate(iso, { day: "2-digit", month: "short" });
export const weekday = (iso: string) => formatDate(iso, { weekday: "long" });

export const daysUntil = (iso: string) => {
  if (!iso) return null;
  const target = new Date(`${iso.slice(0, 10)}T15:00:00`).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / 86_400_000);
};

export const uid = (prefix = "id") =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

export const proById = (id: string) => PROS.find((p) => p.id === id);
export const districtById = (id: string) => DISTRICTS.find((d) => d.id === id);
export const missionById = (id: string) => MISSIONS.find((m) => m.id === id);
export const stationById = (id: string) => RADIO_STATIONS.find((s) => s.id === id);

export const crewPro = (entry: CrewEntry): Pro | undefined => proById(entry.proId);

export interface BudgetSummary {
  initial: number;
  estimated: number;
  committed: number;
  deposits: number;
  paid: number;
  remaining: number;
  available: number;
  plannedAvailable: number;
  estimatePercent: number;
  commitPercent: number;
  crewCount: number;
  overBudget: boolean;
  categoryTotals: { districtId: string; total: number }[];
}

const COMMITTED_STATUSES = ["confirmed", "paid", "done"];

export function computeBudget(state: StoryState): BudgetSummary {
  const initial = state.wedding.budget || 0;
  const estimated = state.crew.reduce((sum, e) => sum + (Number(e.fee) || 0), 0);
  const committed = state.crew
    .filter((e) => COMMITTED_STATUSES.includes(e.status))
    .reduce((sum, e) => sum + (Number(e.fee) || 0), 0);
  const deposits = state.crew
    .filter((e) => COMMITTED_STATUSES.includes(e.status))
    .reduce((sum, e) => sum + (Number(e.deposit) || 0), 0);
  const paid = state.crew
    .filter((e) => ["paid", "done"].includes(e.status))
    .reduce((sum, e) => sum + (Number(e.fee) || 0), 0);
  const byDistrict = new Map<string, number>();
  for (const entry of state.crew) {
    const pro = proById(entry.proId);
    if (!pro) continue;
    byDistrict.set(pro.districtId, (byDistrict.get(pro.districtId) || 0) + (Number(entry.fee) || 0));
  }
  return {
    initial,
    estimated,
    committed,
    deposits,
    paid,
    remaining: Math.max(0, committed - deposits),
    available: initial - committed,
    plannedAvailable: initial - estimated,
    estimatePercent: initial > 0 ? Math.round((estimated / initial) * 100) : 0,
    commitPercent: initial > 0 ? Math.round((committed / initial) * 100) : 0,
    crewCount: state.crew.length,
    overBudget: estimated > initial,
    categoryTotals: [...byDistrict.entries()]
      .map(([districtId, total]) => ({ districtId, total }))
      .sort((a, b) => b.total - a.total),
  };
}

export const doneMissions = (state: StoryState) =>
  MISSIONS.filter((m) => state.missions[m.id]?.done).length;

export const progressPercent = (state: StoryState) =>
  Math.round((doneMissions(state) / TOTAL_MISSIONS) * 100);

export const nextMission = (state: StoryState) =>
  MISSIONS.find((m) => !state.missions[m.id]?.done) ?? null;

export function coverageGaps(state: StoryState) {
  const crewJobs = state.crew
    .filter((e) => e.status !== "discovered")
    .map((e) => proById(e.proId)?.job)
    .filter(Boolean) as string[];
  return REQUIRED_JOBS.filter((job) => !crewJobs.includes(job)).map((job) => {
    const candidates = PROS.filter((p) => p.job === job && !state.crew.some((c) => c.proId === p.id));
    return { job, candidates };
  });
}

export function complementarySuggestions(state: StoryState) {
  const ids = new Set(state.crew.map((e) => e.proId));
  const scores = new Map<string, number>();
  for (const id of ids) {
    for (const suggestion of COMPLEMENTS[id] ?? []) {
      if (!ids.has(suggestion)) scores.set(suggestion, (scores.get(suggestion) || 0) + 1);
    }
  }
  return [...scores.entries()]
    .filter(([id]) => !ids.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id, count]) => ({ pro: proById(id)!, count }));
}

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const eventEnd = (event: DayEvent) => {
  const total = toMinutes(event.start) + (Number(event.duration) || 0);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

export function scheduleConflicts(events: DayEvent[]) {
  const sorted = [...events].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const conflicts: { a: DayEvent; b: DayEvent; minutes: number }[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const overlap = toMinutes(a.start) + (Number(a.duration) || 0) - toMinutes(b.start);
    if (overlap > 0) conflicts.push({ a, b, minutes: overlap });
  }
  return conflicts;
}

export function missingInfo(state: StoryState) {
  const missing: string[] = [];
  const w = state.wedding;
  if (!w.partnerA.trim() || !w.partnerB.trim()) missing.push("les deux prénoms des mariés");
  if (!w.date) missing.push("la date du mariage");
  if (!w.place.trim()) missing.push("le lieu");
  if (!w.guests || w.guests < 2) missing.push("le nombre d'invités");
  if (!w.budget || w.budget < 1000) missing.push("le budget global");
  if (!state.crew.length) missing.push("au moins un personnage dans l'équipe");
  return missing;
}

export interface AriaAction {
  label: string;
  kind: "mission" | "view" | "pro" | "reminder" | "budget";
  value: string;
}

export interface AriaReply {
  text: string;
  actions: AriaAction[];
}

export function ariaReply(state: StoryState, prompt: string): AriaReply {
  const text = prompt.toLowerCase();
  const budget = computeBudget(state);
  const gaps = coverageGaps(state);
  const conflicts = scheduleConflicts(state.events);
  const next = nextMission(state);
  const missing = missingInfo(state);

  const has = (...words: string[]) => words.some((w) => text.includes(w));

  if (has("budget", "argent", "coût", "cout", "dépense", "depense", "tarif", "prix")) {
    const lines = [
      `Budget : ${euro(budget.initial)} d'enveloppe, ${euro(budget.estimated)} d'estimations, ${euro(budget.committed)} réellement engagés.`,
      `Il reste ${euro(budget.available)} de disponible et ${euro(budget.remaining)} à régler sur les engagements confirmés.`,
      budget.overBudget
        ? `Vos estimations dépassent l'enveloppe de ${euro(Math.abs(budget.plannedAvailable))}. Je peux vous montrer les scénarios d'arbitrage, sans rien engager.`
        : `Vous gardez ${euro(budget.plannedAvailable)} de marge sur les estimations. Gardez au moins 8 % pour l'imprévu.`,
    ];
    return {
      text: lines.join("\n"),
      actions: [
        { label: "Ouvrir le budget vivant", kind: "view", value: "budget" },
        { label: "Voir les alternatives", kind: "budget", value: "cheapest" },
      ],
    };
  }

  if (has("conflit", "horaire", "chevauche", "timing", "planning")) {
    if (!conflicts.length) {
      const dinner = state.events.find((e) => e.id === "e5") ?? state.events[0];
      const dinnerEnd = dinner ? eventEnd(dinner) : "l'heure prévue";
      return {
        text: `J'ai vérifié votre Jour J : aucun chevauchement. Les ${state.events.length} séquences sont compatibles avec leurs durées. Le dîner finit à ${dinnerEnd} et la première danse peut commencer sereinement.`,
        actions: [{ label: "Ouvrir le Jour J", kind: "view", value: "jour-j" }],
      };
    }
    return {
      text: `J'ai détecté ${conflicts.length} chevauchement${conflicts.length > 1 ? "s" : ""} : ${conflicts
        .map((c) => `« ${c.a.title} » et « ${c.b.title} » se croisent sur ${c.minutes} min`)
        .join(" ; ")}. Décalez l'un des deux ou réduisez sa durée.`,
      actions: [{ label: "Régler la timeline", kind: "view", value: "jour-j" }],
    };
  }

  if (has("mission", "suite", "quoi faire", "prochaine", "avancer", "étape")) {
    return {
      text: next
        ? `Prochaine mission utile : « ${next.title} » (chapitre ${next.index}/24). ${next.brief} Elle se joue dans ${districtById(next.districtId)?.name}. Une fois accomplie, le monde révèle : ${next.reward}.`
        : `Les 24 missions sont accomplies. Votre mini-site est prêt, la ville est entièrement allumée. Il reste les remerciements et le livre des souvenirs.`,
      actions: [
        { label: "Ouvrir la mission", kind: "mission", value: next?.id ?? "m24" },
        { label: "Voir le calendrier", kind: "view", value: "agenda" },
      ],
    };
  }

  if (has("équipe", "equipe", "métier", "metier", "manque", "personnage", "prestataire")) {
    const gapText = gaps.length
      ? gaps
          .slice(0, 4)
          .map((g) => `${g.job} (${g.candidates.length} candidat${g.candidates.length > 1 ? "s" : ""})`)
          .join(", ")
      : "aucun métier clé ne manque";
    return {
      text: `Votre équipe compte ${state.crew.length} personnages. Il manque : ${gapText}. Les profils suggérés ont été filtrés pour éviter les doublons de métier. Ajoutez-les depuis le casting ou la constellation de l'équipe.`,
      actions: [
        ...gaps.slice(0, 2).flatMap((g) =>
          g.candidates.slice(0, 1).map((p) => ({ label: `Ajouter ${p.name}`, kind: "pro" as const, value: p.id })),
        ),
        { label: "Ouvrir le casting", kind: "view", value: "casting" },
      ],
    };
  }

  if (has("alternative", "moins cher", "économ", "econom", "réduire", "reduire", "arbitr")) {
    const options = state.crew
      .map((entry) => {
        const pro = proById(entry.proId);
        if (!pro) return null;
        const alt = PROS.filter((p) => p.job === pro.job && p.id !== pro.id).sort((a, b) => a.fee - b.fee)[0];
        if (!alt || alt.fee >= entry.fee) return null;
        return { pro, alt, saving: entry.fee - alt.fee };
      })
      .filter(Boolean) as { pro: Pro; alt: Pro; saving: number }[];
    if (!options.length) {
      return {
        text: "Je ne vois pas d'alternative moins chère à métier égal dans votre équipe actuelle. Les principaux postes sont le lieu, le traiteur et les images : c'est là qu'un arbitrage change vraiment le total.",
        actions: [{ label: "Simuler des scénarios", kind: "view", value: "budget" }],
      };
    }
    const totalSaving = options.reduce((s, o) => s + o.saving, 0);
    return {
      text: `J'ai trouvé ${options.length} alternative${options.length > 1 ? "s" : ""} à métier égal : ${options
        .map((o) => `${o.alt.name} au lieu de ${o.pro.name} (−${euro(o.saving)})`)
        .join(", ")}. Gain potentiel : ${euro(totalSaving)}, sans toucher aux métiers. Aucune réservation n'est effectuée ici.`,
      actions: [
        { label: "Comparer dans le budget", kind: "view", value: "budget" },
        ...options.slice(0, 1).map((o) => ({ label: `Ajouter ${o.alt.name}`, kind: "pro" as const, value: o.alt.id })),
      ],
    };
  }

  if (has("message", "contacter", "relance", "devis", "rappel")) {
    const targetPro = state.crew.length > 0 ? proById(state.crew[0].proId) : undefined;
    let draft = "Votre équipe est encore vide. Choisissez un personnage : je préparerai un message contextualisé avec vos prénoms, la date, le lieu et le nombre d'invités.";
    if (targetPro) {
      const partenaireA = state.wedding.partnerA || "nous";
      const partenaireB = state.wedding.partnerB || "nous";
      const lieu = state.wedding.place || "un lieu à confirmer";
      draft = "Brouillon prêt pour " + targetPro.name + " (" + targetPro.job + ") : « Bonjour " + targetPro.name + ", nous sommes " + partenaireA + " & " + partenaireB + ", mariage le " + formatDate(state.wedding.date) + " à " + lieu + ", " + state.wedding.guests + " invités. Seriez-vous disponible pour un échange de 20 minutes cette semaine ? » Copiez-le ou enregistrez-le en rappel : aucun envoi réel n'est simulé.";
    }
    return {
      text: draft,
      actions: [
        { label: "Préparer un message", kind: "view", value: "aria" },
        { label: "Ouvrir le casting", kind: "view", value: "casting" },
      ],
    };
  }

  if (has("mini-site", "site", "invités", "invites", "rsvp", "faire-part")) {
    return {
      text: `Votre mini-site existe en deux styles : CLASSIC (romantique, minimaliste) et CITY (cinématographique). Vous pouvez l'exporter en HTML ou le publier avec un code de partage. L'aperçu invité masque strictement les données financières, les acomptes et les tarifs.`,
      actions: [
        { label: "Ouvrir le studio", kind: "view", value: "studio" },
        { label: "Aperçu invité", kind: "view", value: "invites" },
      ],
    };
  }

  if (has("lieu", "domaine", "salle", "mont noir")) {
    return {
      text: `${state.wedding.place || "Aucun lieu n'est encore choisi"} pour ${state.wedding.guests} invités. Le chapitre 2 « Trouver son univers » vous fait comparer trois domaines. Isabeau de Montclair (Royal Estate) peut ouvrir un domaine privé, et Lila Chardon adaptera les volumes floraux à l'architecture.`,
      actions: [
        { label: "Voir Royal Estate", kind: "view", value: "monde" },
        { label: "Ajouter Isabeau", kind: "pro", value: "isabeau-montclair" },
      ],
    };
  }

  if (has("date", "quand", "compte", "jour j")) {
    const days = daysUntil(state.wedding.date);
    return {
      text: `${formatDate(state.wedding.date)}${days !== null ? ` — dans ${days} jours` : ""}. Le Jour J contient ${state.events.length} séquences. Pensez à valider les documents officiels au chapitre 6 et à écrire un plan B météo.`,
      actions: [
        { label: "Ouvrir le Jour J", kind: "view", value: "jour-j" },
        { label: "Voir le calendrier", kind: "view", value: "agenda" },
      ],
    };
  }

  if (has("souvenir", "photo", "cinéma", "cinema", "film", "biographie")) {
    return {
      text: `Vous avez ${state.photos.length} souvenir${state.photos.length > 1 ? "s" : ""} importé${state.photos.length > 1 ? "s" : ""} et ${doneMissions(state)} missions accomplies. Le studio cinéma génère une bande-annonce avec vos prénoms, la date, le lieu et les personnages de l'équipe. June Valois peut transformer les entretiens en livre et en épisode audio.`,
      actions: [
        { label: "Lancer le cinéma", kind: "view", value: "studio" },
        { label: "Ajouter June", kind: "pro", value: "june-valois" },
      ],
    };
  }

  // default contextual answer
  const parts: string[] = [];
  parts.push(
    `Voici la situation : ${state.wedding.partnerA || "vous"} & ${state.wedding.partnerB || "votre histoire"}, ${formatDate(
      state.wedding.date,
    )}, ${state.wedding.place || "lieu à confirmer"}, ${state.wedding.guests} invités.`,
  );
  parts.push(`${doneMissions(state)}/${TOTAL_MISSIONS} missions, ${state.crew.length} personnages, ${euro(budget.estimated)} estimés sur ${euro(budget.initial)}.`);
  if (missing.length) parts.push(`Informations manquantes : ${missing.join(", ")}.`);
  if (gaps.length) parts.push(`Je recommande d'ajouter : ${gaps.slice(0, 3).map((g) => g.job).join(", ")}.`);
  if (conflicts.length) parts.push(`Attention : ${conflicts.length} chevauchement(s) horaire(s) détecté(s).`);
  else parts.push("Aucun conflit horaire détecté.");
  if (next) parts.push(`Prochaine mission : « ${next.title} ».`);
  parts.push("Demandez-moi le budget, les conflits, les alternatives, un message ou les missions.");
  return {
    text: parts.join("\n"),
    actions: [
      { label: "Que faire ensuite ?", kind: "mission", value: next?.id ?? "m24" },
      { label: "Analyser le budget", kind: "view", value: "budget" },
      { label: "Ouvrir l'équipe", kind: "view", value: "crew" },
    ],
  };
}

export function draftMessage(state: StoryState, proId: string, tone: "pro" | "chaleureux" | "relance") {
  const pro = proById(proId);
  if (!pro) return "";
  const couple = `${state.wedding.partnerA || "nous"} & ${state.wedding.partnerB || "nous"}`;
  const intro =
    tone === "relance"
      ? `Je me permets un petit rappel concernant notre échange.`
      : tone === "chaleureux"
        ? `Nous avons découvert votre carte dans ${districtById(pro.districtId)?.name} et votre univers nous parle beaucoup.`
        : `Nous préparons notre mariage et votre métier de ${pro.job.toLowerCase()} nous intéresse.`;
  return `Bonjour ${pro.name},\n\n${intro}\n\nNous sommes ${couple}, mariage prévu le ${formatDate(
    state.wedding.date,
  )} à ${state.wedding.place || "un lieu à confirmer"} pour ${state.wedding.guests} invités. Votre prestation « ${
    pro.services[0]
  } » nous intéresse (budget indicatif ${euro(pro.fee)}).\n\nSeriez-vous disponible pour un échange de 20 minutes cette semaine ?\n\nBelle journée,\n${couple}\n\n— Message préparé dans AIME® CITY, non envoyé.`;
}

export type ScenarioId = "current" | "balanced" | "essential";

export interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  total: number;
  delta: number;
  swaps: { fromProId: string; toProId: string; saving: number }[];
}

export function buildScenarios(state: StoryState): Scenario[] {
  const current = state.crew.reduce((s, e) => s + (Number(e.fee) || 0), 0);
  const swaps: Scenario["swaps"] = [];
  for (const entry of state.crew) {
    const pro = proById(entry.proId);
    if (!pro) continue;
    const alt = PROS.filter((p) => p.job === pro.job && p.id !== pro.id).sort((a, b) => a.fee - b.fee)[0];
    if (alt && alt.fee < entry.fee) {
      swaps.push({ fromProId: pro.id, toProId: alt.id, saving: entry.fee - alt.fee });
    }
  }
  const saving = swaps.reduce((s, x) => s + x.saving, 0);
  const premium = state.crew.reduce((s, e) => {
    const pro = proById(e.proId);
    if (!pro) return s;
    const top = PROS.filter((p) => p.job === pro.job).sort((a, b) => b.fee - a.fee)[0];
    return s + (top ? Math.max(e.fee, top.fee) : e.fee);
  }, 0);
  return [
    {
      id: "current",
      name: "Scénario actuel",
      description: "Votre sélection telle qu'elle est aujourd'hui.",
      total: current,
      delta: 0,
      swaps: [],
    },
    {
      id: "balanced",
      name: "Équilibré",
      description: "Même métiers, alternatives les plus accessibles de la ville.",
      total: current - saving,
      delta: -saving,
      swaps,
    },
    {
      id: "essential",
      name: "Signature premium",
      description: "Simulation haute : les profils les plus ambitieux à chaque poste.",
      total: premium,
      delta: premium - current,
      swaps: [],
    },
  ];
}

export function buildPublicSite(state: StoryState): PublicSite {
  const w = state.wedding;
  const program = [...state.events]
    .sort((a, b) => a.start.localeCompare(b.start))
    .filter((e) => e.id !== "e1")
    .map((e) => ({ title: e.title, start: e.start, place: e.place, icon: e.icon, duration: e.duration }));
  const team = state.crew.map((entry) => {
    const pro = proById(entry.proId);
    const claim = state.claims[entry.proId];
    return {
      name: claim?.displayName || pro?.name || "Prestataire",
      job: pro?.job || "",
      district: districtById(pro?.districtId || "")?.name || "",
    };
  });
  const music = RADIO_STATIONS.map((station) => {
    const link = state.radio.find((r) => r.stationId === station.id);
    return { name: station.name, moment: link?.moment || station.moment, url: link?.url || "" };
  }).filter((m) => m.url);
  const memories = MISSIONS.filter((m) => state.missions[m.id]?.done).map((m) => ({
    title: m.title,
    text: m.reward,
  }));
  return {
    couple: `${w.partnerA || "Vous"} & ${w.partnerB || "Votre histoire"}`,
    partnerA: w.partnerA,
    partnerB: w.partnerB,
    date: w.date,
    place: w.place,
    cityName: w.cityName,
    guests: w.guests,
    mood: w.mood,
    style: state.miniSite.style,
    headline: state.miniSite.headline,
    welcome: state.miniSite.welcome,
    practical: state.miniSite.practical,
    dressCode: state.miniSite.dressCode,
    program,
    team,
    photos: state.photos.map((p) => ({ src: p.src, caption: p.caption })),
    music,
    memories,
    publishedAt: new Date().toISOString(),
  };
}

const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function buildSiteHtml(site: PublicSite, baseUrl = "") {
  const city = site.style === "city";
  const bg = city ? `${baseUrl}/images/hero.jpg` : `${baseUrl}/images/ceremony.jpg`;
  const programHtml = site.program
    .map(
      (p) =>
        `<li><span class="time">${esc(p.start)}</span><span class="icon">${esc(p.icon)}</span><div><strong>${esc(
          p.title,
        )}</strong><small>${esc(p.place)}</small></div></li>`,
    )
    .join("");
  const teamHtml = site.team
    .map((t) => `<li><strong>${esc(t.name)}</strong><span>${esc(t.job)} · ${esc(t.district)}</span></li>`)
    .join("");
  const photosHtml = site.photos
    .slice(0, 6)
    .map((p) => `<figure><img src="${esc(p.src)}" alt="${esc(p.caption)}"/><figcaption>${esc(p.caption)}</figcaption></figure>`)
    .join("");
  const musicHtml = site.music
    .slice(0, 5)
    .map((m) => `<li><a href="${esc(m.url)}" target="_blank" rel="noreferrer">${esc(m.name)}</a><span>${esc(m.moment)}</span></li>`)
    .join("");
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(site.couple)} — ${esc(site.headline)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>
:root{--white:#ffffff;--grey:#e5e5e5;--line:rgba(255,255,255,.13)}
*{box-sizing:border-box}
html,body{margin:0;background:#000;color:#fff;font-family:Inter,ui-sans-serif,system-ui,sans-serif;line-height:1.65;letter-spacing:-.01em;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%}
h1,h2,h3{font-family:"Inter Tight",Inter,sans-serif;font-weight:600;letter-spacing:-.035em;line-height:.98;margin:0}
.kicker{font-size:11px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.5)}
.wrap{max-width:1080px;margin:0 auto;padding:0 24px 96px}
header{min-height:86vh;display:flex;flex-direction:column;justify-content:flex-end;padding:64px 0 48px;${city ? `background:linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,.72) 45%,#000),url('${bg}') center/cover no-repeat` : ""}}
h1{font-size:clamp(2.6rem,9vw,6rem);letter-spacing:-.045em;line-height:.92}
h1 span{color:var(--white)}
.meta{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.6);margin-top:14px}
h2{font-size:clamp(1.5rem,4vw,2.25rem);margin:88px 0 28px;padding-top:32px;border-top:1px solid var(--line)}
p.lead{font-size:clamp(1.0625rem,2.4vw,1.375rem);line-height:1.7;color:rgba(255,255,255,.78);max-width:64ch}
ul{list-style:none;padding:0;margin:0;display:grid;gap:10px}
li.prog{display:flex;gap:20px;align-items:center;border:1px solid var(--line);border-radius:18px;padding:18px 20px;background:rgba(255,255,255,.03)}
.time{font-variant-numeric:tabular-nums;font-family:"Inter Tight",Inter,sans-serif;font-weight:600;color:var(--grey);min-width:58px;font-size:1.125rem}
.icon{font-size:22px}
small{display:block;color:rgba(255,255,255,.5);font-size:13px;margin-top:2px}
.team li{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(255,255,255,.09);padding:16px 0;font-size:15px}
.team span{color:rgba(255,255,255,.5);font-size:13px}
.photos{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
figure{margin:0;border:1px solid var(--line);border-radius:20px;overflow:hidden}
figure img{width:100%;height:240px;object-fit:cover}
figcaption{padding:14px 18px;font-size:13px;color:rgba(255,255,255,.6)}
.music li{display:flex;justify-content:space-between;gap:16px;font-size:15px;border-bottom:1px solid rgba(255,255,255,.09);padding:16px 0}
.music a{color:#fff;text-decoration:none;border-bottom:1px solid var(--white)}
.music span{color:rgba(255,255,255,.5);font-size:13px}
.card{border:1px solid var(--line);border-radius:24px;padding:28px;background:rgba(255,255,255,.03);margin-top:20px}
.card p{margin:0 0 12px;color:rgba(255,255,255,.75)}
.cta{display:inline-flex;align-items:center;gap:10px;margin-top:20px;padding:16px 30px;border-radius:999px;background:#fff;color:#000;font-weight:600;text-decoration:none;font-size:15px}
footer{margin-top:96px;border-top:1px solid var(--line);padding-top:28px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.4)}
@media(max-width:640px){header{min-height:78vh}.wrap{padding:0 20px 72px}h2{margin:64px 0 22px}}
</style></head>
<body><div class="wrap">
<header>
<div class="kicker">${city ? "AIME® CITY — Love is an open world" : "Invitation privée"}</div>
<h1>${esc(site.partnerA)} <span>&amp;</span> ${esc(site.partnerB)}</h1>
<div class="meta">${esc(formatDate(site.date))} · ${esc(site.place)} · ${site.guests} invités</div>
<p class="lead" style="margin-top:28px">${esc(site.welcome)}</p>
</header>
<h2>Le programme</h2>
<ul>${programHtml}</ul>
${site.team.length ? `<h2>L'équipe du jour</h2><ul class="team">${teamHtml}</ul>` : ""}
${site.photos.length ? `<h2>Souvenirs</h2><div class="photos">${photosHtml}</div>` : ""}
${site.music.length ? `<h2>La bande-son</h2><ul class="music">${musicHtml}</ul>` : ""}
<h2>Informations pratiques</h2>
<div class="card"><p>${esc(site.practical)}</p><p><strong style="color:#fff">Dress code.</strong> ${esc(site.dressCode)}</p></div>
<h2>RSVP</h2>
<div class="card"><p>Confirmez votre présence auprès des mariés. Aucune donnée financière n'est partagée sur cette page.</p>
<a class="cta" href="mailto:?subject=${encodeURIComponent(`RSVP ${site.couple}`)}">Répondre aux mariés</a></div>
<footer>AIME® CITY · Love is an open world · page générée · personnages et prestataires fictifs</footer>
</div></body></html>`;
}

