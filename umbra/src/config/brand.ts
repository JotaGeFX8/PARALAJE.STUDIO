/**
 * Identidad de marca centralizada.
 *
 * El nombre es PROVISIONAL. Para cambiarlo en toda la web:
 *   - define NEXT_PUBLIC_BRAND_NAME en .env.local / Vercel (sin tocar código), o
 *   - cambia el valor por defecto de este archivo.
 * Las plantillas de correo de Supabase llevan el nombre escrito: ver docs/RENOMBRAR.md.
 */
const name = (process.env.NEXT_PUBLIC_BRAND_NAME ?? "").trim() || "UMBRA";

export const BRAND = {
  name,
  tagline: "Explora ideas. Encuentra personas. Construye posibilidades.",
  shortTagline: "Explora ideas. Encuentra personas.",
  description:
    "Comunidad independiente de exploración, conocimiento y conexión humana. Ciencia, historia, conciencia, autosuficiencia y proyectos reales.",
  locale: "es_ES",
} as const;
