import { SUPABASE_URL } from "@/lib/env";

/**
 * Las imágenes de Supabase Storage se sirven a través de la propia web
 * (/media/… → reescritura en next.config.ts). Así funcionan en cualquier
 * entorno, comparten origen con la página y no exponen la URL del backend.
 */
const PREFIX = `${SUPABASE_URL}/storage/v1/object/`;

export function mediaUrl<T extends string | null | undefined>(url: T): T {
  if (!url || !SUPABASE_URL || !url.startsWith(PREFIX)) return url;
  return `/media/${url.slice(PREFIX.length)}` as T;
}

/** URL pública de una portada (bucket «covers»). */
export function coverUrl(path: string | null | undefined) {
  return path ? `/media/public/covers/${path}` : null;
}
