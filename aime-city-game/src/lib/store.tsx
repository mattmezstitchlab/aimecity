"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  APP_VERSION,
  createDemoState,
  createExplorerState,
  defaultWedding,
  makeEvents,
  RADIO_STATIONS,
  MISSIONS,
} from "./data";
import { districtById, proById, uid } from "./engine";
import type {
  Ambience,
  ClaimedCard,
  CrewEntry,
  DayEvent,
  LocalRsvp,
  MissionState,
  MiniSiteSettings,
  PhotoMemory,
  ProStatus,
  Reminder,
  StoryState,
  Wedding,
} from "./types";

const SAVE_KEY = "aime-city-save-v1";
const DB_NAME = "aime-city";
const STORE_NAME = "world";

async function idbGet<T>(): Promise<T | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return null;
  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (value: T | null) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(value);
    };
    // IndexedDB peut rester bloqué (aperçu intégré, navigation privée,
    // stockage désactivé) : le jeu doit toujours pouvoir s'ouvrir.
    timer = setTimeout(() => finish(null), 1200);
    try {
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
      };
      request.onblocked = () => finish(null);
      request.onerror = () => finish(null);
      request.onsuccess = () => {
        const database = request.result;
        try {
          const tx = database.transaction(STORE_NAME, "readonly");
          const get = tx.objectStore(STORE_NAME).get(SAVE_KEY);
          get.onsuccess = () => finish((get.result as T) ?? null);
          get.onerror = () => finish(null);
          tx.onabort = () => finish(null);
          tx.onerror = () => finish(null);
        } catch {
          finish(null);
        }
      };
    } catch {
      finish(null);
    }
  });
}

async function idbSet(value: StoryState) {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  try {
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const database = request.result;
      const tx = database.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(value, SAVE_KEY);
    };
  } catch {
    /* IndexedDB is best-effort; localStorage stays the fallback. */
  }
}

export function normalizeStory(raw: unknown): StoryState | null {
  if (!raw || typeof raw !== "object") return null;
  const base = createExplorerState();
  const candidate = raw as Partial<StoryState>;
  if (!candidate.wedding || typeof candidate.wedding !== "object") return null;
  const missions: Record<string, MissionState> = {};
  for (const mission of MISSIONS) {
    const saved = candidate.missions?.[mission.id];
    missions[mission.id] = {
      done: Boolean(saved?.done),
      date: saved?.date ?? "",
      note: saved?.note ?? "",
      planB: saved?.planB ?? "",
      choice: saved?.choice ?? "",
    };
  }
  return {
    ...base,
    ...candidate,
    version: APP_VERSION,
    wedding: { ...defaultWedding(), ...candidate.wedding },
    missions,
    events: Array.isArray(candidate.events) && candidate.events.length ? candidate.events : makeEvents(candidate.wedding.date ?? base.wedding.date),
    crew: Array.isArray(candidate.crew)
      ? candidate.crew.map((entry) => ({ ...entry, place: entry.place ?? districtById(proById(entry.proId)?.districtId ?? "")?.name ?? "" }))
      : [],
    radio: Array.isArray(candidate.radio) && candidate.radio.length ? candidate.radio : base.radio,
    photos: Array.isArray(candidate.photos) ? candidate.photos : [],
    aria: Array.isArray(candidate.aria) ? candidate.aria : [],
    reminders: Array.isArray(candidate.reminders) ? candidate.reminders : [],
    rsvps: Array.isArray(candidate.rsvps) ? candidate.rsvps : [],
    claims: candidate.claims ?? {},
    miniSite: { ...base.miniSite, ...(candidate.miniSite ?? {}) },
    publishedCode: candidate.publishedCode ?? null,
  };
}

interface AimeContextValue {
  story: StoryState | null;
  hydrated: boolean;
  saveStatus: "idle" | "saving" | "saved";
  notice: string;
  toast: (message: string) => void;
  startDemo: () => void;
  startNewStory: (wedding: Wedding) => void;
  exploreFreely: () => void;
  resumeStory: () => void;
  quitToLanding: () => void;
  resetWorld: () => void;
  updateWedding: (patch: Partial<Wedding>) => void;
  addPro: (proId: string, status?: ProStatus) => void;
  removePro: (proId: string) => void;
  replacePro: (proId: string, nextProId: string) => void;
  updateCrew: (proId: string, patch: Partial<CrewEntry>) => void;
  toggleMission: (missionId: string) => void;
  updateMission: (missionId: string, patch: Partial<MissionState>) => void;
  updateEvent: (eventId: string, patch: Partial<DayEvent>) => void;
  addEvent: () => void;
  removeEvent: (eventId: string) => void;
  setAmbience: (ambience: Ambience) => void;
  setRadioLink: (stationId: string, patch: { url?: string; moment?: string; note?: string }) => void;
  saveClaim: (proId: string, card: ClaimedCard) => void;
  pushAria: (role: "aria" | "user", text: string) => void;
  clearAria: () => void;
  addReminder: (text: string, due: string) => void;
  removeReminder: (id: string) => void;
  addPhoto: (photo: PhotoMemory) => void;
  removePhoto: (id: string) => void;
  updateMiniSite: (patch: Partial<MiniSiteSettings>) => void;
  addRsvp: (rsvp: LocalRsvp) => void;
  setPublishedCode: (code: string | null) => void;
  exportJson: () => string;
  importJson: (raw: string) => boolean;
}

const AimeContext = createContext<AimeContextValue | null>(null);

export function AimeProvider({ children }: { children: ReactNode }) {
  const [story, setStory] = useState<StoryState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      let loaded: StoryState | null = null;
      try {
        let local: string | null = null;
        try {
          local = typeof window === "undefined" ? null : window.localStorage.getItem(SAVE_KEY);
        } catch {
          local = null;
        }
        if (local) {
          try {
            loaded = normalizeStory(JSON.parse(local));
          } catch {
            loaded = null;
          }
        }
        if (!loaded) {
          const fromIdb = await idbGet<unknown>();
          loaded = normalizeStory(fromIdb);
        }
      } catch {
        loaded = null;
      }
      if (!alive) return;
      setStory(loaded);
      setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toast = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 3800);
  }, []);

  const persist = useCallback((next: StoryState | null) => {
    setStory(next);
    if (!next) {
      window.localStorage.removeItem(SAVE_KEY);
      return;
    }
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    setSaveStatus("saving");
    void idbSet(next);
    setTimeout(() => setSaveStatus("saved"), 420);
  }, []);

  const patch = useCallback(
    (updater: (current: StoryState) => StoryState) => {
      setStory((current) => {
        if (!current) return current;
        const next = updater({ ...current, updatedAt: new Date().toISOString() });
        try {
          window.localStorage.setItem(SAVE_KEY, JSON.stringify(next));
          void idbSet(next);
        } catch {
          /* storage full, keep in memory */
        }
        setSaveStatus("saved");
        return next;
      });
    },
    [],
  );

  const startDemo = useCallback(() => {
    persist(createDemoState());
    toast("Démo chargée");
  }, [persist, toast]);

  const startNewStory = useCallback(
    (wedding: Wedding) => {
      const template = createDemoState();
      const fresh: StoryState = {
        ...template,
        demo: false,
        started: true,
        wedding,
        crew: [],
        missions: {},
        events: makeEvents(wedding.date),
        claims: {},
        photos: [],
        miniSite: {
          ...template.miniSite,
          headline: `${wedding.partnerA} & ${wedding.partnerB} — Love is an open world`,
          welcome: wedding.note || `Nous avons choisi de construire notre mariage comme un monde. Le ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${wedding.date}T12:00:00`))}, il ouvrira ses portes à ${wedding.guests} invités.`,
          practical: `${wedding.place || "Lieu à confirmer"} · informations de transport et hébergement à compléter.`,
          dressCode: "Tenue de soirée. Tons crème, or et rose conseillés.",
        },
        rsvps: [],
        publishedCode: null,
        reminders: [],
        aria: [
          {
            id: "aria-new",
            role: "aria",
            text: `Bienvenue dans AIME® CITY, ${wedding.partnerA} & ${wedding.partnerB}. Votre ville est ouverte : ${wedding.place || "lieu à définir"}, ${wedding.guests} invités, ${new Intl.NumberFormat("fr-FR").format(wedding.budget)} € d'enveloppe. Je vous suis pas à pas — commencez par la mission « Le oui fondateur » ou explorez les 12 quartiers.`,
            at: new Date().toISOString(),
          },
        ],
        radio: template.radio,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persist(fresh);
      toast("Monde ouvert");
    },
    [persist, toast],
  );

  const exploreFreely = useCallback(() => {
    persist(createExplorerState());
    toast("Exploration libre");
  }, [persist, toast]);

  const resumeStory = useCallback(() => {
    patch((current) => (current ? { ...current, started: true } : current));
  }, [patch]);

  const quitToLanding = useCallback(() => {
    setStory((current) => {
      if (!current) return current;
      const next = { ...current, started: false };
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(next));
      void idbSet(next);
      return next;
    });
  }, []);

  const resetWorld = useCallback(() => {
    persist(null);
    toast("Monde réinitialisé");
  }, [persist, toast]);

  const value = useMemo<AimeContextValue>(() => {
    return {
      story,
      hydrated,
      saveStatus,
      notice,
      toast,
      startDemo,
      startNewStory,
      exploreFreely,
      resumeStory,
      quitToLanding,
      resetWorld,
      updateWedding: (changes) =>
        patch((current) => ({
          ...current,
          wedding: { ...current.wedding, ...changes },
        })),
      addPro: (proId, status = "selected") =>
        patch((current) => {
          if (current.crew.some((entry) => entry.proId === proId)) return current;
          const pro = proById(proId);
          if (!pro) return current;
          return {
            ...current,
            crew: [
              ...current.crew,
              { proId, status, fee: pro.fee, deposit: 0, time: pro.duration, place: districtById(pro.districtId)?.name ?? "", note: "" },
            ],
          };
        }),
      removePro: (proId) =>
        patch((current) => ({ ...current, crew: current.crew.filter((entry) => entry.proId !== proId) })),
      replacePro: (proId, nextProId) =>
        patch((current) => {
          const pro = proById(nextProId);
          if (!pro) return current;
          const exists = current.crew.find((entry) => entry.proId === proId);
          if (!exists) return current;
          return {
            ...current,
            crew: current.crew.map((entry) =>
              entry.proId === proId
                ? { ...entry, proId: nextProId, fee: pro.fee, deposit: 0, time: pro.duration }
                : entry,
            ),
          };
        }),
      updateCrew: (proId, changes) =>
        patch((current) => ({
          ...current,
          crew: current.crew.map((entry) => {
            if (entry.proId !== proId) return entry;
            const next = { ...entry, ...changes };
            if (changes.status === "paid" || changes.status === "done") {
              next.deposit = Number(next.fee) || 0;
            }
            return next;
          }),
        })),
      toggleMission: (missionId) =>
        patch((current) => {
          const existing = current.missions[missionId];
          const done = !existing?.done;
          return {
            ...current,
            missions: {
              ...current.missions,
              [missionId]: {
                done,
                date: done ? new Date().toISOString().slice(0, 10) : "",
                note: existing?.note ?? "",
                planB: existing?.planB ?? "",
                choice: existing?.choice ?? "",
              },
            },
          };
        }),
      updateMission: (missionId, changes) =>
        patch((current) => {
          const fallback: MissionState = { done: false, date: "", note: "", planB: "", choice: "" };
          return {
            ...current,
            missions: {
              ...current.missions,
              [missionId]: { ...fallback, ...(current.missions[missionId] ?? {}), ...changes },
            },
          };
        }),
      updateEvent: (eventId, changes) =>
        patch((current) => ({
          ...current,
          events: current.events.map((event) => (event.id === eventId ? { ...event, ...changes } : event)),
        })),
      addEvent: () =>
        patch((current) => ({
          ...current,
          events: [
            ...current.events,
            {
              id: uid("event"),
              title: "Nouvelle séquence",
              start: "12:00",
              duration: 60,
              place: current.wedding.place,
              proId: "",
              icon: "✦",
              status: "prevu",
              planB: "",
            },
          ],
        })),
      removeEvent: (eventId) =>
        patch((current) => ({ ...current, events: current.events.filter((event) => event.id !== eventId) })),
      setAmbience: (ambience) => patch((current) => ({ ...current, ambience })),
      setRadioLink: (stationId, changes) =>
        patch((current) => {
          const existing = current.radio.find((link) => link.stationId === stationId);
          if (!existing) {
            const station = RADIO_STATIONS.find((s) => s.id === stationId);
            return {
              ...current,
              radio: [
                ...current.radio,
                { stationId, url: changes.url ?? "", moment: changes.moment ?? station?.moment ?? "", note: changes.note ?? "" },
              ],
            };
          }
          return {
            ...current,
            radio: current.radio.map((link) => (link.stationId === stationId ? { ...link, ...changes } : link)),
          };
        }),
      saveClaim: (proId, card) =>
        patch((current) => ({ ...current, claims: { ...current.claims, [proId]: card } })),
      pushAria: (role, text) =>
        patch((current) => ({
          ...current,
          aria: [...current.aria, { id: uid("aria"), role, text, at: new Date().toISOString() }].slice(-40),
        })),
      clearAria: () => patch((current) => ({ ...current, aria: [] })),
      addReminder: (text, due) =>
        patch((current) => ({
          ...current,
          reminders: [...current.reminders, { id: uid("rem"), text, due, createdAt: new Date().toISOString() }],
        })),
      removeReminder: (id) =>
        patch((current) => ({ ...current, reminders: current.reminders.filter((r: Reminder) => r.id !== id) })),
      addPhoto: (photo) => patch((current) => ({ ...current, photos: [...current.photos, photo] })),
      removePhoto: (id) =>
        patch((current) => ({ ...current, photos: current.photos.filter((photo: PhotoMemory) => photo.id !== id) })),
      updateMiniSite: (changes) =>
        patch((current) => ({ ...current, miniSite: { ...current.miniSite, ...changes } })),
      addRsvp: (rsvp) => patch((current) => ({ ...current, rsvps: [rsvp, ...current.rsvps] })),
      setPublishedCode: (code) => patch((current) => ({ ...current, publishedCode: code })),
      exportJson: () => JSON.stringify(story, null, 2),
      importJson: (raw) => {
        try {
          const parsed = normalizeStory(JSON.parse(raw));
          if (!parsed) return false;
          persist({ ...parsed, started: true });
          toast("Sauvegarde importée");
          return true;
        } catch {
          return false;
        }
      },
    };
  }, [story, hydrated, saveStatus, notice, toast, startDemo, startNewStory, exploreFreely, resumeStory, quitToLanding, resetWorld, patch, persist]);

  return <AimeContext.Provider value={value}>{children}</AimeContext.Provider>;
}

export function useAime() {
  const ctx = useContext(AimeContext);
  if (!ctx) throw new Error("useAime must be used inside AimeProvider");
  return ctx;
}
