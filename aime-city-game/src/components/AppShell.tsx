"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { computeBudget, daysUntil, doneMissions, euro, formatDate, progressPercent } from "@/lib/engine";
import { usePrefs } from "@/lib/prefs";
import { useAime } from "@/lib/store";
import type { ViewId } from "@/lib/types";
import Aria from "./Aria";
import Budget from "./Budget";
import Casting, { CharacterViewer } from "./Casting";
import CityMap from "./CityMap";
import Crew from "./Crew";
import JourJ from "./JourJ";
import { CalendarView, StoryView } from "./Planning";
import { RadioView, SettingsView } from "./RadioSettings";
import Studio, { GuestPreviewCard } from "./Studio";
import { Icon, Progress, Sheet, type IconName } from "./ui";

const PRIMARY: { id: ViewId; label: string; icon: IconName }[] = [
  { id: "monde", label: "Monde", icon: "world" },
  { id: "casting", label: "Casting", icon: "users" },
  { id: "crew", label: "Équipe", icon: "crew" },
  { id: "histoire", label: "Missions", icon: "story" },
  { id: "aria", label: "ARIA", icon: "aria" },
];

const SECONDARY: { id: ViewId; label: string; icon: IconName; hint: string }[] = [
  { id: "agenda", label: "Calendrier", icon: "calendar", hint: "24 missions" },
  { id: "budget", label: "Budget vivant", icon: "wallet", hint: "Estimations" },
  { id: "jour-j", label: "Jour J", icon: "journey", hint: "Timeline" },
  { id: "radio", label: "AIME® Radio", icon: "radio", hint: "7 univers" },
  { id: "studio", label: "Studio", icon: "studio", hint: "Mini-site" },
  { id: "invites", label: "Aperçu invité", icon: "user", hint: "Sans budget" },
  { id: "reglages", label: "Réglages", icon: "settings", hint: "Sauvegarde" },
];

const TITLES: Record<string, string> = {
  monde: "Le monde",
  casting: "Casting",
  crew: "AIME® Crew",
  histoire: "Mode histoire",
  agenda: "Calendrier",
  budget: "Budget vivant",
  "jour-j": "Le jour J",
  studio: "Studio",
  radio: "AIME® Radio",
  reglages: "Réglages",
  invites: "Aperçu invité",
  aria: "ARIA",
};

export default function AppShell() {
  const { story, saveStatus, notice } = useAime();
  const { handheld, consoleMode, haptic, orientation, set } = usePrefs();
  const [view, setView] = useState<ViewId>("monde");
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewer, setViewer] = useState<{ ids: string[]; index: number } | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(170);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () => setHeaderHeight(Math.ceil(header.getBoundingClientRect().height));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const navigate = useCallback(
    (next: ViewId) => {
      haptic("tap");
      setView(next);
      setMenuOpen(false);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [haptic],
  );

  const openPro = useCallback((proId: string, ids?: string[]) => {
    const list = ids && ids.length ? ids : [proId];
    const index = Math.max(0, list.indexOf(proId));
    setViewer({ ids: list, index });
  }, []);

  if (!story) return null;

  const budget = computeBudget(story);
  const days = daysUntil(story.wedding.date);
  const progress = progressPercent(story);
  const railMode = !handheld || consoleMode;

  const hudChips = (
    <>
      <button type="button" onClick={() => navigate("jour-j")} className={`chip ${view === "jour-j" ? "chip-active" : ""}`}>
        <Icon name="clock" size={18} className="text-white" />
        <span className="tabular font-semibold">{days !== null ? `J-${days}` : "Date"}</span>
      </button>
      <button type="button" onClick={() => navigate("budget")} className={`chip ${view === "budget" ? "chip-active" : ""}`}>
        <Icon name="wallet" size={18} className="text-white" />
        <span className="tabular font-semibold">{euro(budget.available)}</span>
      </button>
      <button type="button" onClick={() => navigate("histoire")} className={`chip ${view === "histoire" ? "chip-active" : ""}`}>
        <Icon name="story" size={18} className="text-white/70" />
        <span className="tabular font-semibold">{doneMissions(story)}/24</span>
      </button>
      <button type="button" onClick={() => navigate("agenda")} className={`chip ${view === "agenda" ? "chip-active" : ""}`}>
        <Icon name="calendar" size={18} />
        Agenda
      </button>
      <button type="button" onClick={() => navigate("radio")} className={`chip ${view === "radio" ? "chip-active" : ""}`}>
        <Icon name="radio" size={18} />
        Radio
      </button>
      <button type="button" onClick={() => navigate("studio")} className={`chip ${view === "studio" ? "chip-active" : ""}`}>
        <Icon name="studio" size={18} />
        Studio
      </button>
    </>
  );

  return (
    <div className="min-h-dvh bg-noir">
      {/* ---------------- HUD ---------------- */}
      <header ref={headerRef} className="safe-t sticky top-0 z-50 border-b border-[rgba(255,255,255,0.1)] bg-black/92 px-4 pb-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("monde")}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[rgba(255,255,255,0.18)] bg-white/5 text-white"
            aria-label="AIME CITY — le monde"
          >
            <Icon name="heart" size={24} />
          </button>
          <button type="button" onClick={() => navigate("reglages")} className="min-w-0 flex-1 text-left">
            <p className="title-3 truncate">
              {story.wedding.partnerA || "Vous"} <span className="text-white">&amp;</span> {story.wedding.partnerB || "votre histoire"}
              {story.demo && <span className="ml-2 rounded-full border border-cream/25 px-2 py-0.5 align-middle text-[0.75rem] uppercase tracking-[0.12em] text-cream/60">démo</span>}
            </p>
            <p className="meta truncate text-cream/55">
              {story.wedding.place || "Lieu à définir"} · {formatDate(story.wedding.date)}
            </p>
          </button>
          <button type="button" onClick={() => setMenuOpen(true)} className="icon-btn" aria-label="Ouvrir le menu complet">
            <Icon name="menu" size={24} />
          </button>
        </div>

        <div className="no-scrollbar mx-auto mt-2 flex max-w-[1600px] gap-2 overflow-x-auto pb-1">{hudChips}</div>

        <div className="mx-auto mt-2 flex max-w-[1600px] items-center gap-3">
          <Progress value={progress} height={5} />
          <span className="shrink-0 text-[0.8125rem] text-cream/45">{saveStatus === "saving" ? "sauvegarde…" : "sauvegardé"}</span>
        </div>
      </header>

      {/* ---------------- Rail (tablette, desktop, téléphone en paysage) ---------------- */}
      {railMode && (
        <nav
          className="fixed bottom-0 left-0 z-40 flex w-[96px] flex-col items-center gap-1 overflow-y-auto border-r border-[rgba(255,255,255,0.1)] bg-black py-5 no-scrollbar"
          style={{ top: headerHeight }}
          aria-label="Navigation principale"
        >
          {[...PRIMARY, ...SECONDARY.map(({ id, label, icon }) => ({ id, label, icon }))].map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                aria-current={active ? "page" : undefined}
                className={`flex w-[76px] flex-col items-center gap-1 rounded-2xl px-1 py-2.5 transition ${
                  active ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon name={item.icon} size={24} strokeWidth={active ? 1.9 : 1.6} />
                <span className="text-center text-[0.8125rem] font-semibold leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ---------------- Contenu ---------------- */}
      <main className={`app-main relative z-10 mx-auto w-full max-w-[1600px] px-4 pt-4 ${railMode ? "pl-[104px]" : ""}`}>
        <div className="mb-3 flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-cream/40">
          <Icon name="world" size={16} /> {TITLES[view] ?? "AIME® CITY"}
          <span className="text-cream/20">/</span>
          <span className="truncate">{story.wedding.cityName}</span>
        </div>

        <div key={view} className="panel-enter">
          {view === "monde" && <CityMap onOpenPro={openPro} onNavigate={navigate} />}
          {view === "casting" && <Casting />}
          {view === "crew" && <Crew onOpenPro={openPro} onNavigate={navigate} />}
          {view === "histoire" && <StoryView onOpenPro={openPro} onNavigate={navigate} />}
          {view === "agenda" && <CalendarView onNavigate={navigate} onOpenPro={openPro} />}
          {view === "budget" && <Budget onOpenPro={openPro} onNavigate={navigate} />}
          {view === "jour-j" && <JourJ onNavigate={navigate} />}
          {view === "studio" && <Studio onNavigate={navigate} />}
          {view === "radio" && <RadioView />}
          {view === "reglages" && <SettingsView />}
          {view === "aria" && <Aria onOpenPro={openPro} onNavigate={navigate} />}
          {view === "invites" && (
            <div className="space-y-4">
              <GuestPreviewCard onNavigate={navigate} />
            </div>
          )}
        </div>
      </main>

      {/* ---------------- Navigation au pouce ---------------- */}
      {!railMode && (
        <nav
          className="safe-b fixed inset-x-0 bottom-0 z-50 border-t border-[rgba(255,255,255,0.14)] bg-black px-1 pt-1.5"
          aria-label="Navigation au pouce"
        >
          <div className="flex items-stretch">
            {PRIMARY.map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={active ? "page" : undefined}
                  className="relative flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1"
                >
                  {active && <span className="absolute inset-x-4 top-0 h-1 rounded-full bg-white" />}
                  <Icon name={item.icon} size={28} className={active ? "text-white" : "text-cream/60"} strokeWidth={active ? 2 : 1.7} />
                  <span className={`text-[0.8125rem] font-semibold ${active ? "text-cream" : "text-cream/55"}`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* ---------------- Menu complet ---------------- */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} kicker="AIME® CITY" title="Explorer">
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-2.5">
            {[...PRIMARY, ...SECONDARY].map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`flex min-h-[84px] items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    active ? "border-white bg-white/10" : "border-[rgba(255,255,255,0.12)] bg-white/[0.03] hover:border-[rgba(255,255,255,0.28)]"
                  }`}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[rgba(255,255,255,0.16)] text-white/80">
                    <Icon name={item.icon} size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[1rem] font-semibold">{item.label}</span>
                    {(item as { hint?: string }).hint && (
                      <span className="meta block truncate text-cream/45">{(item as { hint?: string }).hint}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="glass-soft space-y-3 p-4">
            <div className="flex flex-wrap gap-2">
              {(["auto", "portrait", "landscape"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => set({ orientation: mode })}
                  className={`chip ${orientation === mode ? "chip-active" : ""}`}
                >
                  <Icon name={mode === "landscape" ? "grid" : mode === "portrait" ? "portrait" : "target"} size={18} />
                  {mode === "auto" ? "Auto" : mode === "portrait" ? "Portrait" : "Paysage"}
                </button>
              ))}
            </div>
            <p className="meta text-cream/50">
              {consoleMode ? "Panneaux latéraux." : "Navigation au pouce."}
            </p>
          </div>
        </div>
      </Sheet>

      {viewer && (
        <CharacterViewer
          ids={viewer.ids}
          index={viewer.index}
          onIndex={(index: number) => setViewer((current) => (current ? { ...current, index } : current))}
          onClose={() => setViewer(null)}
        />
      )}

      {notice && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--nav-h)+var(--safe-b)+12px)] z-[100] flex justify-center px-4 md:bottom-6">
          <div className="pointer-events-auto flex max-w-lg items-center gap-2.5 rounded-2xl border border-white/25 bg-[#0a0a0a] px-5 py-3.5 text-[0.9375rem] text-white shadow-2xl">
            <Icon name="spark" size={20} className="shrink-0 text-white" />
            {notice}
          </div>
        </div>
      )}
    </div>
  );
}
