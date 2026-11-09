import type { NextConfig } from "next";

// Tolera espacios o texto extra pegado por error en la variable: se queda con la primera URL válida.
const SUPABASE = ((process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").match(/https?:\/\/[^\s"']+/)?.[0] ?? "").replace(/\/$/, "");
const SUPABASE_WS = SUPABASE.replace(/^http/, "ws");
const isDev = process.env.NODE_ENV !== "production";
// Solo para vistas previas embebidas: permite mostrar la web dentro de un marco.
const allowFraming = process.env.ALLOW_FRAMING === "1";

/**
 * Política de seguridad de contenidos. Next.js necesita scripts en línea para
 * hidratar la página ('unsafe-inline'); el resto queda restringido al propio
 * dominio y a Supabase. React escapa todo el contenido de usuarios.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE} ${SUPABASE_WS}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  `frame-ancestors ${allowFraming ? "*" : "'none'"}`,
].join("; ");

/** Cabeceras de seguridad aplicadas a todas las respuestas. */
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  ...(allowFraming ? [] : [{ key: "X-Frame-Options", value: "DENY" }]),
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/** Orígenes extra autorizados para Server Actions (p. ej. un proxy de vista previa). */
const extraOrigins = (process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Las imágenes se reducen en el navegador; 4 MB cubre 4 imágenes con margen
      // y queda por debajo del límite de 4,5 MB de las funciones de Vercel.
      bodySizeLimit: "4mb",
      allowedOrigins: extraOrigins,
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Imágenes de Supabase Storage servidas desde el mismo dominio (ver src/lib/media.ts).
  async rewrites() {
    return SUPABASE ? [{ source: "/media/:path*", destination: `${SUPABASE}/storage/v1/object/:path*` }] : [];
  },
};

export default nextConfig;
