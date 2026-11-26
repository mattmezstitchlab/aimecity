"use client";

import { useState } from "react";
import { PROS, STATUS_LABELS, STATUS_ORDER } from "@/lib/data";
import { buildScenarios, computeBudget, coverageGaps, districtById, euro, proById } from "@/lib/engine";
import { usePrefs } from "@/lib/prefs";
import { useAime } from "@/lib/store";
import type { ProStatus, ViewId } from "@/lib/types";
import { Icon, Progress, SectionTitle } from "./ui";

export default function Budget({
  onOpenPro,
  onNavigate,
}: {
  onOpenPro: (proId: string, ids?: string[]) => void;
  onNavigate: (view: ViewId) => void;
}) {
  const { story, updateCrew, updateWedding, addPro, replacePro, toast } = useAime();
  const { haptic } = usePrefs();
  const [scenario, setScenario] = useState<"current" | "balanced" | "essential">("current");
  if (!story) return null;

  const budget = computeBudget(story);
  const gaps = coverageGaps(story);
  const scenarios = buildScenarios(story);
  const active = scenarios.find((item) => item.id === scenario) ?? scenarios[0];
  const maxDistrict = Math.max(1, ...budget.categoryTotals.map((item) => item.total));

  return (
    <div className="space-y-4">
      <SectionTitle
        kicker="Budget vivant · simulation"
        title="Chaque choix recalcule le monde"
        subtitle="Estimations et engagements réels sont strictement distingués. Aucun paiement, aucune réservation : tout reste dans votre navigateur."
      />

      <div className="glass p-7">
        <p className="kicker">Disponible sur engagements confirmés</p>
        <p className="title-hero mt-1 tabular" style={{ fontSize: "clamp(2.25rem,10vw,3.5rem)" }}>
          {euro(budget.available)}
        </p>
        <div className="mt-3">
          <Progress value={budget.estimatePercent} height={10} />
        </div>
        <p className="meta mt-2">
          {euro(budget.estimated)} estimés sur {euro(budget.initial)} · {budget.estimatePercent}%
        </p>
        <label className="mt-4 block">
          <span className="label">Enveloppe de simulation</span>
          <input
            type="number"
            inputMode="numeric"
            step={500}
            className="field tabular"
            value={story.wedding.budget}
            onChange={(event) => updateWedding({ budget: Number(event.target.value) })}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Estimations", value: euro(budget.estimated), hint: `${budget.crewCount} postes` },
          { label: "Engagements", value: euro(budget.committed), hint: `${budget.commitPercent}% confirmés`, tone: "#ffffff" },
          { label: "Acomptes", value: euro(budget.deposits), hint: "simulation", tone: "#c4c4c4" },
          { label: "Reste à payer", value: euro(budget.remaining), hint: "sur engagements", tone: "#e5e5e5" },
        ].map((item) => (
          <div key={item.label} className="glass-soft p-4">
            <p className="kicker">{item.label}</p>
            <p className="title-2 mt-1.5 tabular" style={item.tone ? { color: item.tone } : undefined}>{item.value}</p>
            <p className="meta mt-0.5 text-cream/45">{item.hint}</p>
          </div>
        ))}
      </div>

      {budget.overBudget && (
        <div className="rounded-3xl border border-white/50 bg-[rgba(255,255,255,0.12)] p-4 text-[1rem] leading-relaxed text-cream/85">
          <strong className="text-white">Alerte ARIA.</strong> Vos estimations dépassent l&apos;enveloppe de {euro(Math.abs(budget.plannedAvailable))}.
          Le scénario équilibré propose des alternatives à métier égal, sans rien modifier automatiquement.
        </div>
      )}

      <section className="space-y-3">
        <p className="kicker">Comparateur de scénarios</p>
        {scenarios.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              haptic("tap");
              setScenario(item.id);
            }}
            className={`w-full rounded-3xl border p-4 text-left transition ${
              scenario === item.id ? "border-white bg-[rgba(255,255,255,0.14)]" : "border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)]"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="title-3">{item.name}</p>
              <p className="title-2 tabular">{euro(item.total)}</p>
            </div>
            <p className="meta mt-1">{item.description}</p>
            <p className="mt-1 text-[0.9375rem] font-semibold tabular" style={{ color: item.delta > 0 ? "#e5e5e5" : item.delta < 0 ? "#ffffff" : "rgba(255,255,255,0.5)" }}>
              {item.delta === 0 ? "Référence actuelle" : `${item.delta > 0 ? "+" : ""}${euro(item.delta)}`}
            </p>
          </button>
        ))}

        {active.id === "balanced" && active.swaps.length > 0 && (
          <div className="glass p-4">
            <p className="kicker">Remplacements proposés</p>
            <div className="mt-2 space-y-2">
              {active.swaps.map((swap) => {
                const from = proById(swap.fromProId);
                const to = proById(swap.toProId);
                if (!from || !to) return null;
                return (
                  <div key={swap.fromProId} className="flex items-center justify-between gap-3 text-[0.9375rem]">
                    <span className="min-w-0 truncate text-cream/75">{from.name} → {to.name}</span>
                    <span className="shrink-0 font-semibold tabular text-[#ffffff]">−{euro(swap.saving)}</span>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                active.swaps.forEach((swap) => replacePro(swap.fromProId, swap.toProId));
                haptic("success");
                toast("Scénario équilibré appliqué · estimations mises à jour");
                setScenario("current");
              }}
              className="btn btn-lg btn-primary btn-block mt-3"
            >
              Appliquer ce scénario
            </button>
          </div>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-[rgba(255,255,255,0.1)] p-4">
          <p className="kicker">Détail par personnage</p>
          <button type="button" onClick={() => onNavigate("crew")} className="text-[0.9375rem] font-semibold text-white">
            Gérer l&apos;équipe
          </button>
        </div>
        <div className="divide-y divide-[rgba(255,255,255,0.08)]">
          {story.crew.map((entry) => {
            const pro = proById(entry.proId);
            if (!pro) return null;
            return (
              <div key={entry.proId} className="space-y-3 p-4">
                <button type="button" onClick={() => onOpenPro(pro.id, story.crew.map((item) => item.proId))} className="flex w-full items-center gap-3 text-left">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pro.art} alt="" className="h-full w-full object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[1.0625rem] font-semibold">{pro.name}</span>
                    <span className="meta block truncate">{pro.job}</span>
                  </span>
                  <Icon name="chevron" size={22} className="shrink-0 text-cream/40" />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="label">Tarif</span>
                    <input type="number" inputMode="numeric" className="field tabular" value={entry.fee} onChange={(event) => updateCrew(pro.id, { fee: Number(event.target.value) })} />
                  </label>
                  <label className="block">
                    <span className="label">Acompte</span>
                    <input type="number" inputMode="numeric" className="field tabular" value={entry.deposit} onChange={(event) => updateCrew(pro.id, { deposit: Number(event.target.value) })} />
                  </label>
                </div>
                <label className="block">
                  <span className="label">Statut</span>
                  <select className="field" value={entry.status} onChange={(event) => updateCrew(pro.id, { status: event.target.value as ProStatus })}>
                    {STATUS_ORDER.map((status) => (
                      <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                </label>
              </div>
            );
          })}
          {!story.crew.length && (
            <div className="p-6 text-center">
              <p className="text-[1rem] text-cream/65">Aucun poste budgété. Sélectionnez des personnages pour voir le budget vivre.</p>
              <button type="button" onClick={() => onNavigate("casting")} className="btn btn-lg btn-primary mt-3">Ouvrir le casting</button>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="glass p-6">
          <p className="kicker">Répartition par quartier</p>
          <div className="mt-3 space-y-3">
            {budget.categoryTotals.map((item) => {
              const district = districtById(item.districtId);
              return (
                <div key={item.districtId}>
                  <div className="flex items-center justify-between text-[0.9375rem]">
                    <span className="truncate text-cream/75">{district?.name}</span>
                    <span className="tabular text-cream/60">{euro(item.total)}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.1)]">
                    <div className="h-full rounded-full" style={{ width: `${(item.total / maxDistrict) * 100}%`, background: "#ffffff" }} />
                  </div>
                </div>
              );
            })}
            {!budget.categoryTotals.length && <p className="meta">Rien à répartir pour l&apos;instant.</p>}
          </div>
        </div>

        <div className="glass p-6">
          <p className="kicker">ARIA · métiers à budgéter</p>
          <div className="mt-3 space-y-2">
            {gaps.map((gap) => {
              const candidate = [...gap.candidates].sort((a, b) => a.fee - b.fee)[0] ?? PROS.find((pro) => pro.job === gap.job);
              return (
                <div key={gap.job} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-[1rem] text-cream/80">{gap.job}</span>
                  {candidate ? (
                    <button
                      type="button"
                      onClick={() => {
                        haptic("success");
                        addPro(candidate.id, "quote");
                      }}
                      className="chip chip-active shrink-0 tabular"
                    >
                      <Icon name="plus" size={18} /> {euro(candidate.fee)}
                    </button>
                  ) : (
                    <span className="meta">—</span>
                  )}
                </div>
              );
            })}
            {!gaps.length && <p className="meta">Tous les métiers clés sont couverts.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
