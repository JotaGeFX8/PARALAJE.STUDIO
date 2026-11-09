import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { SITE_URL } from "@/lib/env";
import { BRAND } from "@/config/brand";
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

/** Aviso opcional para entornos de prueba (p. ej. «Vista previa · datos de demostración»). Vacío en producción. */
const DEMO_NOTICE = process.env.NEXT_PUBLIC_DEMO_NOTICE ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — ${BRAND.shortTagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  openGraph: {
    title: BRAND.name,
    description: BRAND.tagline,
    type: "website",
    locale: "es_ES",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f4f4ee",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        {children}
        {DEMO_NOTICE && (
          <p
            role="note"
            className="pointer-events-none fixed bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/85 px-3.5 py-1.5 text-[0.6875rem] font-medium tracking-wide text-canvas shadow-lg md:bottom-4"
          >
            {DEMO_NOTICE}
          </p>
        )}
      </body>
    </html>
  );
}
