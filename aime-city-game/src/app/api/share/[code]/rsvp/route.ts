import { eq } from "drizzle-orm";
import { db } from "@/db";
import { guestRsvps, weddingSites } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const body = (await request.json()) as {
      guestName?: unknown;
      attending?: unknown;
      guestsCount?: unknown;
      song?: unknown;
      message?: unknown;
    };
    const guestName = typeof body.guestName === "string" ? body.guestName.trim().slice(0, 80) : "";
    if (!guestName) return Response.json({ error: "Votre nom est requis." }, { status: 400 });

    const site = await db.select({ id: weddingSites.id }).from(weddingSites).where(eq(weddingSites.code, code.toUpperCase())).limit(1);
    if (!site.length) return Response.json({ error: "Mini-site introuvable." }, { status: 404 });

    await db.insert(guestRsvps).values({
      siteCode: code.toUpperCase(),
      guestName,
      attending: body.attending !== false,
      guestsCount: Math.min(12, Math.max(1, Number(body.guestsCount) || 1)),
      song: typeof body.song === "string" ? body.song.trim().slice(0, 140) : "",
      message: typeof body.message === "string" ? body.message.trim().slice(0, 400) : "",
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("rsvp error", error);
    return Response.json({ error: "Réponse non enregistrée." }, { status: 500 });
  }
}
