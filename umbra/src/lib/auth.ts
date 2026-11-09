import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { ProfileRow } from "@/lib/supabase/types";

export type Member = { userId: string; email: string; profile: ProfileRow };

/**
 * Sesión verificada contra Supabase Auth (getUser valida el token en el
 * servidor de Auth; nunca confiamos solo en la cookie). Memorizada por petición.
 */
export const getMember = cache(async (): Promise<Member | null> => {
  await connection(); // Siempre por petición: nunca prerenderizar datos de sesión.
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  // Los campos personales solo son legibles a través de my_profile() (privacidad en la base de datos).
  const { data: rows } = await supabase.rpc("my_profile");
  const profile = rows?.[0];
  if (!profile) return null;
  // Actividad para la analítica agregada (una escritura cada 10 min como mucho). Sin esperar:
  // .then() lanza la petición sin retrasar la página.
  supabase.rpc("touch_last_seen").then(
    () => undefined,
    () => undefined,
  );
  return { userId: data.user.id, email: data.user.email ?? "", profile };
});

/** Exige sesión. Sin ella, redirige a /acceso. */
export async function requireMember(): Promise<Member> {
  const member = await getMember();
  if (!member) redirect("/acceso");
  return member;
}

/** Exige sesión y perfil completado. */
export async function requireOnboardedMember(): Promise<Member> {
  const member = await requireMember();
  if (!member.profile.onboarded_at) redirect("/bienvenida");
  return member;
}

/** En /acceso, /registro y /recuperar: con sesión verificada, ir a la app. */
export async function redirectIfSignedIn() {
  if (await getMember()) redirect("/explorar");
}
