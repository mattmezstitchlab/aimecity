"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("AIME CITY error", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-noir px-6 text-center">
      <div>
        <p className="kicker text-white">Perturbation dans la ville</p>
        <h1 className="font-display mt-2 text-[clamp(2rem,7vw,3.5rem)] leading-none">Le monde a vacillé</h1>
        <p className="mx-auto mt-3 max-w-md text-[12px] leading-relaxed text-cream/55">
          Vos données locales restent sauvegardées. Relancez le monde : la ville reprendra là où vous l&apos;aviez laissée.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" onClick={reset} className="btn btn-primary">
            Relancer le monde
          </button>
          <Link href="/" className="btn btn-ghost">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
