"use client";

import { useState } from "react";

export default function RsvpForm({ code }: { code: string }) {
  const [form, setForm] = useState({ guestName: "", attending: true, guestsCount: 1, song: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.guestName.trim()) return;
    setState("sending");
    setError("");
    try {
      const response = await fetch(`/api/share/${code}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Réponse non enregistrée.");
      }
      setState("sent");
    } catch (cause) {
      setState("error");
      setError(cause instanceof Error ? cause.message : "Réponse non enregistrée.");
    }
  };

  if (state === "sent") {
    return (
      <div className="rounded-2xl border border-[#ffffff]/40 bg-[rgba(255,255,255,0.1)] p-5 text-center">
        <p className="text-2xl">❥</p>
        <h3 className="title-2 mt-1">Merci {form.guestName}</h3>
        <p className="mt-1 text-[0.9375rem] leading-relaxed text-[#ffffff]/70">
          Votre réponse a bien été enregistrée sur la page du mariage. Les mariés la découvriront depuis leur espace AIME® CITY.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <label className="block">
        <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-[#ffffff]/60">Votre nom</span>
        <input
          value={form.guestName}
          onChange={(event) => setForm({ ...form, guestName: event.target.value })}
          className="mt-1.5 min-h-[52px] w-full rounded-2xl border border-[#ffffff]/20 bg-[#000000]/60 px-4 py-3 text-[16px] text-[#ffffff] outline-none focus:border-[#ffffff]"
          placeholder="Nom & prénom"
        />
      </label>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setForm({ ...form, attending: true })}
          className={`min-h-[52px] flex-1 rounded-full border px-3 text-[0.9375rem] font-semibold uppercase tracking-[0.08em] ${form.attending ? "border-[#ffffff] bg-[rgba(255,255,255,0.18)]" : "border-[#ffffff]/20 text-[#ffffff]/60"}`}
        >
          Je serai là
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, attending: false })}
          className={`min-h-[52px] flex-1 rounded-full border px-3 text-[0.9375rem] font-semibold uppercase tracking-[0.08em] ${!form.attending ? "border-[#ffffff] bg-[rgba(255,255,255,0.18)]" : "border-[#ffffff]/20 text-[#ffffff]/60"}`}
        >
          Je ne peux pas
        </button>
      </div>
      <label className="block">
        <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-[#ffffff]/60">Nombre de personnes</span>
        <input
          type="number"
          min={1}
          max={8}
          value={form.guestsCount}
          onChange={(event) => setForm({ ...form, guestsCount: Number(event.target.value) })}
          className="mt-1.5 min-h-[52px] w-full rounded-2xl border border-[#ffffff]/20 bg-[#000000]/60 px-4 py-3 text-[16px] text-[#ffffff] outline-none focus:border-[#ffffff]"
        />
      </label>
      <label className="block">
        <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-[#ffffff]/60">Un titre à passer au DJ ?</span>
        <input
          value={form.song}
          onChange={(event) => setForm({ ...form, song: event.target.value })}
          className="mt-1.5 min-h-[52px] w-full rounded-2xl border border-[#ffffff]/20 bg-[#000000]/60 px-4 py-3 text-[16px] text-[#ffffff] outline-none focus:border-[#ffffff]"
          placeholder="Artiste — titre"
        />
      </label>
      <label className="block">
        <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-[#ffffff]/60">Un mot pour les mariés</span>
        <textarea
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          className="mt-1.5 min-h-[104px] w-full rounded-2xl border border-[#ffffff]/20 bg-[#000000]/60 px-4 py-3 text-[16px] text-[#ffffff] outline-none focus:border-[#ffffff]"
        />
      </label>
      {state === "error" && <p className="text-[0.9375rem] text-[#ffffff]">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={state === "sending" || !form.guestName.trim()}
        className="min-h-[56px] w-full rounded-full bg-white px-4 text-[1rem] font-bold uppercase tracking-[0.1em] text-[#000000] disabled:opacity-40"
      >
        {state === "sending" ? "Envoi…" : "Envoyer ma réponse"}
      </button>
      <p className="text-[0.875rem] leading-relaxed text-[#ffffff]/50">
        Réponse transmise à la page du mariage. Aucun paiement, aucune donnée financière n&apos;est partagée.
      </p>
    </div>
  );
}
