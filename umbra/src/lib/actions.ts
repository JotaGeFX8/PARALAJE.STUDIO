import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Cliente de servidor + id del usuario verificado (null si no hay sesión). */
export async function getActionContext() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id ?? null };
}

/** Traduce errores de la base de datos a mensajes comprensibles. */
export function dbErrorMessage(error: Pick<PostgrestError, "code" | "message"> | null | undefined, fallback = "No se ha podido completar la acción.") {
  if (!error) return fallback;
  switch (error.code) {
    case "42501":
      return "No tienes permiso para hacer esto.";
    case "23505":
      return "Esto ya existe.";
    case "P0429":
      return error.message; // límites de frecuencia: el mensaje ya es claro
    case "23514":
    case "22023":
    case "P0001":
      return error.message;
    default:
      console.error("db", error.code, error.message);
      return fallback;
  }
}

export const SESSION_EXPIRED = "Tu sesión ha caducado. Vuelve a entrar.";
