import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-noir px-6 text-center">
      <div>
        <p className="kicker text-white">Quartier introuvable</p>
        <h1 className="font-display mt-2 text-[clamp(2.2rem,8vw,4rem)] leading-none">
          Cette rue n&apos;existe pas
          <br />
          encore dans AIME® CITY
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[12px] leading-relaxed text-cream/55">
          Le mini-site demandé a peut-être été dépublié, ou le code de partage est incorrect. Retournez au monde pour continuer
          votre histoire.
        </p>
        <Link href="/" className="btn btn-primary mt-5">
          Entrer dans AIME® CITY
        </Link>
      </div>
    </main>
  );
}
