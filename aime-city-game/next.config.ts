import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // L'aperçu Arena est servi depuis https://{port}-{sandbox}.e2b.app.
  // Next.js 16 bloque par défaut ses ressources de développement (HMR),
  // ce qui empêchait l'hydratation React et laissait l'écran de chargement.
  allowedDevOrigins: ["localhost", "*.e2b.app"],
};

export default nextConfig;
