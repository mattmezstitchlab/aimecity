"use client";

import { useAime } from "@/lib/store";
import AppShell from "./AppShell";
import Landing from "./Landing";
import { Icon } from "./ui";

export default function AimeApp() {
  const { story, hydrated } = useAime();

  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center bg-noir px-6">
        <div className="text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-white/40 bg-[rgba(255,255,255,0.12)] text-white animate-pulse-glow">
            <Icon name="heart" size={36} />
          </span>
          <p className="title-1 mt-5 tracking-[0.06em]">AIME® CITY</p>
          <p className="meta mt-5">Chargement du monde…</p>
        </div>
      </div>
    );
  }

  if (!story || !story.started) return <Landing />;
  return <AppShell />;
}
