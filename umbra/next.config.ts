import type { NextConfig } from "next";

/** Cabeceras de seguridad aplicadas a todas las respuestas. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
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
    const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
    return supabase ? [{ source: "/media/:path*", destination: `${supabase}/storage/v1/object/:path*` }] : [];
  },
};

export default nextConfig;
