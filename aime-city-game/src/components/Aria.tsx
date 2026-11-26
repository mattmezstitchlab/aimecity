"use client";

import { useMemo, useRef, useState } from "react";
import { STATUS_LABELS } from "@/lib/data";
import {
  ariaReply,
  computeBudget,
  coverageGaps,
  daysUntil,
  doneMissions,
  draftMessage,
  euro,
  formatDate,
  nextMission,
  proById,
  scheduleConflicts,
} from "@/lib/engine";
import { usePrefs } from "@/lib/prefs";
import { useAime } from "@/lib/store";
import type { ViewId } from "@/lib/types";
import { Icon, Sheet } from "./ui";

const QUICK_PROMPTS = [
  "Que faire ensuite ?",
  "Où en est mon budget ?",
  "Quels métiers manquent ?",
  "Y a-t-il des conflits horaires ?",
  "Des alternatives moins chères ?",
  "Prépare un message prestataire",
];

export default function Aria({
  onOpenPro,
  onNavigate,
}: {
  onOpenPro: (proId: string, ids?: string[]) => void;
  onNavigate: (view: ViewId) => void;
}) {
  const { story, pushAria, clearAria, addPro, addReminder, removeReminder, toast } = useAime();
  const { haptic, silent } = usePrefs();
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [tools, setTools] = useState(false);
  const [messagePro, setMessagePro] = useState("");
  const [tone, setTone] = useState<"pro" | "chaleureux" | "relance">("pro");
  const listRef = useRef<HTMLDivElement>(null);

  const draftResult = useMemo(() => (story && messagePro ? draftMessage(story, messagePro, tone) : ""), [story, messagePro, tone]);

  if (!story) return null;
  const budget = computeBudget(story);
  const gaps = coverageGaps(story);
  const conflicts = scheduleConflicts(story.events);
  const next = nextMission(story);
  const lastActions = ariaReply(story, "état du monde").actions;

  const speak = (text: string) => {
    if (silent || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 320));
    utterance.lang = "fr-FR";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const send = (prompt: string) => {
    if (!prompt.trim()) return;
    haptic("tap");
    pushAria("user", prompt.trim());
    const reply = ariaReply(story, prompt);
    pushAria("aria", reply.text);
    speak(reply.text);
    setInput("");
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 90);
  };

  const startVoice = () => {
    type RecognitionCtor = new () => {
      lang: string;
      interimResults: boolean;
      onresult: (event: { results: { 0: { transcript: string } }[] }) => void;
      onend: () => void;
      onerror: () => void;
      start: () => void;
    };
    const speechWindow = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    const Ctor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Ctor) {
      toast("La dictée vocale n'est pas disponible sur ce navigateur.");
      return;
    }
    try {
      const recognition = new Ctor();
      recognition.lang = "fr-FR";
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        setListening(false);
        send(event.results[0][0].transcript);
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognition.start();
      haptic("soft");
      setListening(true);
    } catch {
      setListening(false);
      toast("Micro indisponible : la saisie texte reste disponible.");
    }
  };

  return (
    <div className="flex min-h-[70dvh] flex-col gap-3">
      <div className="glass flex items-center gap-4 p-5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[rgba(255,255,255,0.18)] bg-white/5 text-white">
          <Icon name="aria" size={28} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="kicker">ARIA · assistante &amp; entremetteuse</p>
          <h1 className="title-2">Je veille sur votre monde</h1>
        </div>
        <button type="button" onClick={() => setTools(true)} className="icon-btn icon-btn-lg" aria-label="Outils ARIA : messages et rappels">
          <Icon name="edit" size={24} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <button type="button" onClick={() => onNavigate("histoire")} className="glass-soft p-3 text-left">
          <p className="kicker">Prochaine mission</p>
          <p className="mt-1 truncate text-[0.9375rem] font-semibold">{next?.title ?? "Tout est fait"}</p>
        </button>
        <button type="button" onClick={() => onNavigate("budget")} className="glass-soft p-3 text-left">
          <p className="kicker">Estimations</p>
          <p className="mt-1 text-[0.9375rem] font-semibold tabular">{euro(budget.estimated)}</p>
        </button>
        <button type="button" onClick={() => onNavigate("jour-j")} className="glass-soft p-3 text-left">
          <p className="kicker">Conflits</p>
          <p className="mt-1 text-[0.9375rem] font-semibold text-white">
            {conflicts.length ? `${conflicts.length} détecté(s)` : "Aucun"}
          </p>
        </button>
        <button type="button" onClick={() => onNavigate("agenda")} className="glass-soft p-3 text-left">
          <p className="kicker">Compte à rebours</p>
          <p className="mt-1 text-[0.9375rem] font-semibold tabular">J-{daysUntil(story.wedding.date) ?? "?"} · {doneMissions(story)}/24</p>
        </button>
      </div>

      <div className="card flex min-h-[44dvh] flex-1 flex-col overflow-hidden">
        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {story.aria.length === 0 && (
            <div className="rounded-3xl rounded-bl-md border border-[rgba(255,255,255,0.14)] bg-white/[0.05] p-4 text-[1rem] leading-relaxed text-cream/85">
              Bonjour {story.wedding.partnerA || "vous"} &amp; {story.wedding.partnerB || "…"}. Je peux analyser votre budget, repérer les
              métiers manquants, détecter les conflits horaires, préparer des messages ou indiquer la prochaine mission.
            </div>
          )}
          {story.aria.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[92%] whitespace-pre-line rounded-3xl px-4 py-3 text-[1rem] leading-relaxed ${
                  message.role === "user"
                    ? "rounded-br-md bg-white text-[#000000]"
                    : "rounded-bl-md border border-[rgba(255,255,255,0.14)] bg-white/[0.05] text-cream/88"
                }`}
              >
                {message.role === "aria" && <span className="kicker mb-1 block text-white">ARIA</span>}
                {message.text}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-1">
            {lastActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  haptic("tap");
                  if (action.kind === "pro") {
                    addPro(action.value);
                    toast(`${proById(action.value)?.name ?? "Personnage"} ajouté à l'équipe`);
                  } else if (action.kind === "mission") {
                    onNavigate("histoire");
                  } else {
                    onNavigate(action.value as ViewId);
                  }
                }}
                className="chip chip-active"
              >
                <Icon name="arrowRight" size={18} /> {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-[rgba(255,255,255,0.1)] p-3">
          {QUICK_PROMPTS.map((prompt) => (
            <button key={prompt} type="button" onClick={() => send(prompt)} className="chip shrink-0">
              {prompt}
            </button>
          ))}
        </div>

        <div className="safe-b flex items-center gap-2 border-t border-[rgba(255,255,255,0.12)] p-3">
          <button
            type="button"
            onClick={startVoice}
            aria-label="Dicter à ARIA"
            className={`icon-btn icon-btn-lg shrink-0 ${listening ? "icon-btn-active animate-pulse-glow" : ""}`}
          >
            <Icon name="mic" size={26} />
          </button>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send(input);
            }}
            placeholder={listening ? "Je vous écoute…" : "Écrivez à ARIA…"}
            className="field"
            enterKeyHint="send"
            aria-label="Message pour ARIA"
          />
          <button type="button" onClick={() => send(input)} className="icon-btn icon-btn-lg shrink-0 border-transparent bg-white text-black" aria-label="Envoyer">
            <Icon name="send" size={24} />
          </button>
        </div>
      </div>

      {gaps.length > 0 && (
        <div className="glass p-4">
          <p className="kicker">Métiers manquants</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {gaps.map((gap) => (
              <button
                key={gap.job}
                type="button"
                onClick={() => {
                  if (!gap.candidates[0]) return;
                  haptic("success");
                  addPro(gap.candidates[0].id, "to_contact");
                  toast(`${gap.candidates[0].name} ajouté · ${gap.job}`);
                }}
                className="chip"
              >
                <Icon name="plus" size={18} /> {gap.job}
              </button>
            ))}
          </div>
        </div>
      )}

      <Sheet open={tools} onClose={() => setTools(false)} kicker="ARIA · outils" title="Messages & rappels">
        <div className="space-y-5 p-5">
          <div className="space-y-3">
            <p className="kicker">Préparer un message</p>
            <select className="field" value={messagePro} onChange={(event) => setMessagePro(event.target.value)} aria-label="Choisir un personnage">
              <option value="">Choisir un personnage de l&apos;équipe…</option>
              {story.crew.map((entry) => {
                const pro = proById(entry.proId);
                return pro ? (
                  <option key={entry.proId} value={entry.proId}>
                    {pro.name} — {pro.job} ({STATUS_LABELS[entry.status]})
                  </option>
                ) : null;
              })}
            </select>
            <div className="flex gap-2">
              {(["pro", "chaleureux", "relance"] as const).map((item) => (
                <button key={item} type="button" onClick={() => setTone(item)} className={`chip capitalize ${tone === item ? "chip-active" : ""}`}>
                  {item}
                </button>
              ))}
            </div>
            {draftResult && (
              <>
                <textarea readOnly value={draftResult} className="field min-h-[220px] text-[0.9375rem] leading-relaxed" aria-label="Brouillon de message" />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(draftResult);
                        haptic("success");
                        toast("Message copié · à coller dans votre messagerie");
                      } catch {
                        toast("Copie indisponible : sélectionnez le texte affiché.");
                      }
                    }}
                    className="btn btn-light flex-1"
                  >
                    <Icon name="share" size={20} /> Copier
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addReminder(`Relancer ${proById(messagePro)?.name ?? "un prestataire"}`, formatDate(story.wedding.date));
                      haptic("tap");
                      toast("Rappel enregistré localement");
                    }}
                    className="btn btn-ghost flex-1"
                  >
                    <Icon name="clock" size={20} /> Rappel
                  </button>
                </div>
                <p className="meta text-cream/45">Aucun message n&apos;est envoyé automatiquement.</p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="kicker">Rappels</p>
              <span className="meta">{story.reminders.length}</span>
            </div>
            {story.reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[rgba(255,255,255,0.12)] p-3">
                <div className="min-w-0">
                  <p className="truncate text-[1rem] text-cream/85">{reminder.text}</p>
                  <p className="meta">{reminder.due}</p>
                </div>
                <button type="button" onClick={() => removeReminder(reminder.id)} className="icon-btn" aria-label="Supprimer le rappel">
                  <Icon name="trash" size={22} />
                </button>
              </div>
            ))}
            {!story.reminders.length && <p className="meta">Aucun rappel enregistré.</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { clearAria(); toast("Conversation effacée"); }} className="btn btn-ghost flex-1">
              Effacer la conversation
            </button>
            <button type="button" onClick={() => { setTools(false); onOpenPro(story.crew[0]?.proId ?? "alma-fournier"); }} className="btn btn-ghost flex-1">
              Voir un personnage
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
