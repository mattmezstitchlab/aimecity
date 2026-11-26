"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type OrientationPref = "auto" | "portrait" | "landscape";

export interface Prefs {
  reduceMotion: boolean;
  haptics: boolean;
  silent: boolean;
  orientation: OrientationPref;
}

interface Viewport {
  w: number;
  h: number;
  orientation: "portrait" | "landscape";
  compact: boolean;
  tablet: boolean;
}

interface PrefsContextValue extends Prefs {
  set: (patch: Partial<Prefs>) => void;
  haptic: (kind?: "tap" | "soft" | "success" | "warn") => void;
  viewport: Viewport;
  /** Mode console : paysage téléphone, panneaux latéraux, immersion cinématographique. */
  consoleMode: boolean;
  /** Écran tactile étroit (< 768px) : navigation au pouce en bas. */
  handheld: boolean;
}

const KEY = "aime-city-prefs-v1";

const DEFAULTS: Prefs = {
  reduceMotion: false,
  haptics: true,
  silent: false,
  orientation: "auto",
};

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [viewport, setViewport] = useState<Viewport>({
    w: 1280,
    h: 800,
    orientation: "landscape",
    compact: false,
    tablet: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(KEY);
        if (raw) setPrefs({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) });
      } catch {
        /* préférences par défaut */
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const read = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({
        w,
        h,
        orientation: w >= h ? "landscape" : "portrait",
        compact: w < 768,
        tablet: w >= 768 && w < 1180,
      });
    };
    read();
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => {
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = prefs.reduceMotion ? "reduced" : "full";
  }, [prefs.reduceMotion]);

  const set = useCallback((patch: Partial<Prefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* stockage indisponible */
      }
      return next;
    });
  }, []);

  const haptic = useCallback(
    (kind: "tap" | "soft" | "success" | "warn" = "tap") => {
      if (!prefs.haptics || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
      const patterns: Record<string, number | number[]> = { tap: 12, soft: 6, success: [14, 40, 22], warn: [24, 60, 24] };
      try {
        navigator.vibrate(patterns[kind]);
      } catch {
        /* retour haptique indisponible */
      }
    },
    [prefs.haptics],
  );

  const shortLandscape = viewport.orientation === "landscape" && viewport.h < 620 && viewport.w < 1180;
  const consoleMode =
    prefs.orientation === "landscape" ? true : prefs.orientation === "portrait" ? false : shortLandscape;

  const value = useMemo<PrefsContextValue>(
    () => ({
      ...prefs,
      set,
      haptic,
      viewport,
      consoleMode,
      handheld: viewport.compact,
    }),
    [prefs, set, haptic, viewport, consoleMode],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}
