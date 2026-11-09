import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});
const sans = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "UMBRA — Explora ideas. Encuentra personas.",
    template: "%s · UMBRA",
  },
  description:
    "Comunidad independiente de exploración, conocimiento y conexión humana. Ciencia, historia, conciencia, autosuficiencia y proyectos reales.",
  applicationName: "UMBRA",
  openGraph: {
    title: "UMBRA",
    description: "Explora ideas. Encuentra personas. Construye posibilidades.",
    type: "website",
    locale: "es_ES",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="grain">{children}</body>
    </html>
  );
}
