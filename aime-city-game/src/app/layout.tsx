import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: "AIME® CITY — Love is an open world",
  description:
    "AIME® CITY : un monde romantique à construire. Vos mariés sont les protagonistes, les prestataires sont les personnages, les préparatifs sont les missions et le mariage est l'aventure.",
  applicationName: "AIME® CITY",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "AIME CITY" },
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#000"/><path d="M32 50c-9-6-16-12-16-20a9 9 0 0 1 16-5 9 9 0 0 1 16 5c0 8-7 14-16 20Z" fill="#ffffff"/></svg>',
          ),
        type: "image/svg+xml",
      },
    ],
  },
  openGraph: {
    title: "AIME® CITY — Love is an open world",
    description: "Votre mariage. Votre monde. Votre histoire.",
    images: ["/images/hero.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@300;400;450;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
