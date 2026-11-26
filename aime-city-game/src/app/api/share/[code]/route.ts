import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { guestRsvps, weddingSites } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const rows = await db.select().from(weddingSites).where(eq(weddingSites.code, code.toUpperCase())).limit(1);
    if (!rows.length) return Response.json({ error: "Mini-site introuvable." }, { status: 404 });
    const rsvps = await db
      .select({
        guestName: guestRsvps.guestName,
        attending: guestRsvps.attending,
        guestsCount: guestRsvps.guestsCount,
        song: guestRsvps.song,
        message: guestRsvps.message,
        createdAt: guestRsvps.createdAt,
      })
      .from(guestRsvps)
      .where(eq(guestRsvps.siteCode, code.toUpperCase()))
      .orderBy(desc(guestRsvps.createdAt))
      .limit(20);
    return Response.json({ site: rows[0].payload, publishedAt: rows[0].updatedAt, rsvps });
  } catch (error) {
    console.error("share read error", error);
    return Response.json({ error: "Lecture impossible." }, { status: 500 });
  }
}
