import { eq } from "drizzle-orm";
import { db } from "@/db";
import { weddingSites } from "@/db/schema";
import type { PublicSite } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode(length = 6) {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

function isValidSite(payload: unknown): payload is PublicSite {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<PublicSite>;
  return typeof candidate.couple === "string" && typeof candidate.date === "string" && Array.isArray(candidate.program);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { payload?: unknown; code?: unknown };
    if (!isValidSite(body.payload)) {
      return Response.json({ error: "Payload du mini-site invalide." }, { status: 400 });
    }
    const payload = body.payload;
    const requested = typeof body.code === "string" ? body.code.toUpperCase().slice(0, 12) : "";
    const code = requested || makeCode();

    const row = {
      code,
      couple: payload.couple.slice(0, 120),
      weddingDate: payload.date.slice(0, 20),
      style: payload.style === "classic" ? "classic" : "city",
      payload,
      updatedAt: new Date(),
    };

    if (requested) {
      const updated = await db.update(weddingSites).set(row).where(eq(weddingSites.code, requested)).returning({ code: weddingSites.code });
      if (updated.length > 0) return Response.json({ code: updated[0].code });
    }

    const inserted = await db
      .insert(weddingSites)
      .values({ ...row, code: requested || makeCode() })
      .onConflictDoUpdate({ target: weddingSites.code, set: row })
      .returning({ code: weddingSites.code });

    return Response.json({ code: inserted[0]?.code ?? row.code });
  } catch (error) {
    console.error("share error", error);
    return Response.json({ error: "Publication indisponible pour le moment." }, { status: 500 });
  }
}
