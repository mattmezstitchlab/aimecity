import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { weddingSites } from "@/db/schema";
import RsvpForm from "@/components/RsvpForm";
import { formatDate } from "@/lib/engine";
import { ART } from "@/lib/data";

export const dynamic = "force-dynamic";

async function loadSite(code: string) {
  try {
    const rows = await db.select().from(weddingSites).where(eq(weddingSites.code, code.toUpperCase())).limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const site = await loadSite(code);
  if (!site) return { title: "Mini-site introuvable — AIME® CITY" };
  return {
    title: `${site.couple} — ${site.payload.headline || "AIME® CITY"}`,
    description: `${site.couple} · ${formatDate(site.weddingDate)} · ${site.payload.place}`,
    openGraph: { images: [site.payload.photos[0]?.src ?? ART.hero] },
  };
}

export default async function SharedSitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const site = await loadSite(code);
  if (!site) notFound();
  const payload = site.payload;
  const city = payload.style === "city";
  const heroImage = payload.photos[0]?.src ?? ART.hero;

  return (
    <main className="min-h-dvh bg-noir text-cream">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="" className={`h-full w-full object-cover ${city ? "opacity-70" : "opacity-35"}`} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55),rgba(0,0,0,0.82)_55%,#000000)]" />
        </div>
        <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 text-white">❥</span>
              <div>
                <p className="font-display text-[0.9375rem] tracking-[0.14em]">AIME® CITY</p>
                <p className="text-[0.75rem] uppercase tracking-[0.2em] text-cream/55">Love is an open world</p>
              </div>
            </div>
            <span className="rounded-full border border-cream/25 px-2.5 py-1 text-[0.75rem] uppercase tracking-[0.14em] text-cream/70">
              {city ? "Style CITY" : "Style CLASSIC"}
            </span>
          </div>

          <div className="pt-20 sm:pt-36">
            <p className="kicker text-white">{city ? "Votre histoire commence ici" : "Vous êtes invités"}</p>
            <h1 className="font-display mt-2 text-[clamp(2.8rem,10vw,6rem)] leading-[0.85]">
              {payload.partnerA || "Vous"} <span className="text-white">&amp;</span> {payload.partnerB || "…"}
            </h1>
            <p className="mt-2 text-[0.875rem] uppercase tracking-[0.14em] text-cream/70">
              {formatDate(payload.date)} · {payload.place} · {payload.guests} invités
            </p>
            <p className={`mt-4 max-w-2xl text-[1.0625rem] leading-relaxed ${city ? "text-cream/80" : "text-cream/65"}`}>{payload.welcome}</p>
            <p className="mt-3 text-[0.875rem] uppercase tracking-[0.12em] text-cream/55">{payload.headline}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl gap-4 px-5 pb-20 sm:grid-cols-[1.1fr_0.9fr] sm:px-8">
        <section className="space-y-3">
          <div className="rounded-3xl border border-cream/15 bg-[rgba(255,255,255,0.05)] p-4">
            <p className="kicker">Programme</p>
            <div className="mt-2 space-y-1.5">
              {payload.program.map((item) => (
                <div key={`${item.start}-${item.title}`} className="flex items-center gap-2.5 rounded-xl border border-cream/10 bg-[rgba(0,0,0,0.4)] px-2.5 py-2">
                  <span className="w-11 title-3 w-14 shrink-0 tabular text-white">{item.start}</span>
                  <span className="text-base">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[1rem] font-semibold">{item.title}</p>
                    <p className="truncate text-[0.875rem] text-cream/55">{item.place} · {item.duration} min</p>
                  </div>
                </div>
              ))}
              {!payload.program.length && <p className="text-[0.9375rem] text-cream/50">Le programme sera dévoilé bientôt.</p>}
            </div>
          </div>

          {payload.team.length > 0 && (
            <div className="rounded-3xl border border-cream/15 bg-[rgba(255,255,255,0.05)] p-4">
              <p className="kicker">L&apos;équipe du jour</p>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                {payload.team.map((member) => (
                  <div key={`${member.name}-${member.job}`} className="flex items-center justify-between gap-2 border-b border-cream/10 py-1 text-[0.9375rem]">
                    <span className="truncate">{member.name}</span>
                    <span className="shrink-0 text-[0.875rem] uppercase tracking-[0.1em] text-cream/40">{member.job}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payload.photos.length > 0 && (
            <div className="rounded-3xl border border-cream/15 bg-[rgba(255,255,255,0.05)] p-4">
              <p className="kicker">Souvenirs</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {payload.photos.slice(0, 4).map((photo) => (
                  <figure key={photo.src + photo.caption} className="overflow-hidden rounded-xl border border-cream/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.src} alt={photo.caption} className="h-40 w-full object-cover" />
                    <figcaption className="px-3 py-2 text-[0.875rem] text-cream/65">{photo.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-3">
          <div className="rounded-3xl border border-cream/15 bg-[rgba(255,255,255,0.05)] p-4">
            <p className="kicker">Informations pratiques</p>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-cream/70">{payload.practical}</p>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-cream/55"><strong className="text-cream/80">Dress code.</strong> {payload.dressCode}</p>
          </div>

          {payload.music.length > 0 && (
            <div className="rounded-3xl border border-cream/15 bg-[rgba(255,255,255,0.05)] p-4">
              <p className="kicker">Suggestions musicales</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {payload.music.slice(0, 6).map((track) => (
                  <a key={track.name} href={track.url} target="_blank" rel="noreferrer" className="rounded-full border border-cream/20 px-3 py-1.5 text-[0.875rem] text-cream/70 hover:border-white">
                    {track.name} · {track.moment}
                  </a>
                ))}
              </div>
            </div>
          )}

          {payload.memories.length > 0 && (
            <div className="rounded-3xl border border-cream/15 bg-[rgba(255,255,255,0.05)] p-4">
              <p className="kicker">Leur aventure</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {payload.memories.map((memory) => (
                  <span key={memory.title} className="rounded-full border border-cream/15 px-3 py-1.5 text-[0.875rem] text-cream/55">{memory.title}</span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-white/12 bg-white/[0.03] p-6">
            <p className="kicker text-white">RSVP</p>
            <RsvpForm code={site.code} />
          </div>
        </aside>
      </div>

      <footer className="mx-auto max-w-4xl px-5 pb-10 text-[0.875rem] uppercase leading-relaxed tracking-[0.18em] text-cream/35 sm:px-8">
        AIME® CITY · Love is an open world · page générée depuis l&apos;espace des mariés · personnages et prestataires fictifs ·
        aucune donnée financière partagée
      </footer>
    </main>
  );
}
