import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Private-beta perimeter, not per-couple authentication.
 * Railway defaults to private access; local preview stays unchanged.
 * Every holder of these credentials has the same access to the beta.
 */
export function proxy(request: NextRequest) {
  // Infrastructure healthcheck exposes no wedding or guest information.
  if (request.nextUrl.pathname === "/api/health") return NextResponse.next();

  const privateAccess =
    process.env.AIME_PRIVATE_ACCESS === "true" ||
    (Boolean(process.env.RAILWAY_PROJECT_ID) && process.env.AIME_PRIVATE_ACCESS !== "false");

  if (!privateAccess) return NextResponse.next();

  const password = process.env.AIME_PRIVATE_PASSWORD;
  const username = process.env.AIME_PRIVATE_USERNAME || "aime";

  // Fail closed instead of accidentally opening a new private deployment.
  if (!password || password.length < 24 || username.includes(":")) {
    return new NextResponse("L’accès privé est en cours de configuration.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }

  const authorization = request.headers.get("authorization") || "";
  const encoded = authorization.length <= 4096 ? /^Basic\s+(\S+)$/i.exec(authorization)?.[1] : undefined;
  let valid = false;

  if (encoded) {
    try {
      const received = Buffer.from(encoded, "base64").toString("utf8");
      const expectedHash = createHash("sha256").update(`${username}:${password}`).digest();
      const receivedHash = createHash("sha256").update(received).digest();
      valid = timingSafeEqual(receivedHash, expectedHash);
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    return new NextResponse("AIME CITY — accès privé. Identifiez-vous pour continuer.", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="AIME CITY - acces prive", charset="UTF-8"',
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  // Do not exempt API routes or public wedding pages from the private gate.
  // Bundled assets contain no server secrets and remain cacheable.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
