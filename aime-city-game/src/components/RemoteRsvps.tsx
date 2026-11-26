"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDate } from "@/lib/engine";
import { useAime } from "@/lib/store";
import { Icon } from "./ui";

interface RemoteRsvp {
  guestName: string;
  attending: boolean;
  guestsCount: number;
  song: string;
  message: string;
  createdAt: string;
}

export default function RemoteRsvps() {
  const { story } = useAime();
  const code = story?.publishedCode ?? null;
  const [items, setItems] = useState<RemoteRsvp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!code) return;
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/share/${code}`, { signal, cache: "no-store" });
        if (!response.ok) throw new Error("Lecture impossible.");
        const data = (await response.json()) as { rsvps?: RemoteRsvp[] };
        setItems(Array.isArray(data.rsvps) ? data.rsvps : []);
      } catch (cause) {
        if (signal?.aborted) return;
        setError(cause instanceof Error ? cause.message : "Lecture impossible.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [code],
  );

  useEffect(() => {
    if (!code) return;
    const controller = new AbortController();
    const timer = setTimeout(() => void load(controller.signal), 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [code, load]);

  if (!code) {
    return (
      <div className="glass p-6">
        <p className="kicker">Réponses des invités</p>
        <p className="meta mt-2">Publiez le mini-site pour recevoir les réponses.</p>
      </div>
    );
  }

  return (
    <div className="glass p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="kicker">Réponses des invités</p>
        <div className="flex items-center gap-2">
          <span className="meta tabular">{items.length}</span>
          <button type="button" onClick={() => void load()} className="icon-btn" aria-label="Actualiser les réponses" disabled={loading}>
            <Icon name="reset" size={20} />
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {items.map((rsvp, index) => (
          <div key={`${rsvp.guestName}-${rsvp.createdAt}-${index}`} className="rounded-2xl border border-[rgba(255,255,255,0.12)] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[1rem] font-semibold">{rsvp.guestName}</span>
              <span className="text-[0.9375rem] text-white/85">
                {rsvp.attending ? `${rsvp.guestsCount} pers.` : "absent"}
              </span>
            </div>
            {(rsvp.song || rsvp.message) && (
              <div className="mt-1 space-y-0.5">
                {rsvp.song && <p className="meta">♪ {rsvp.song}</p>}
                {rsvp.message && <p className="meta text-cream/50">{rsvp.message}</p>}
              </div>
            )}
            <p className="meta mt-1 text-cream/35">{formatDate(rsvp.createdAt)}</p>
          </div>
        ))}
        {!items.length && !loading && !error && <p className="meta">Aucune réponse pour l&apos;instant.</p>}
        {loading && <p className="meta">Chargement…</p>}
        {error && <p className="meta text-cream/70">{error}</p>}
      </div>
    </div>
  );
}
