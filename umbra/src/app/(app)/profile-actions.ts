"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dbErrorMessage } from "@/lib/actions";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { profileSchema, readProfileForm } from "@/lib/validation/profile";
import type { UserGoal } from "@/lib/supabase/types";

/** Guarda el perfil completo (bienvenida en 5 pasos y edición): datos, temas, objetivos y privacidad. */
export async function saveProfileAction(_: FormState, formData: FormData): Promise<FormState> {
  const mode = formData.get("mode") === "edit" ? "edit" : "onboarding";
  const parsed = profileSchema.safeParse(readProfileForm(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), message: "Revisa los campos marcados." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { message: "Tu sesión ha caducado. Vuelve a entrar." };
  const uid = auth.user.id;

  const { topics, goals, privacy, ...fields } = parsed.data;
  const { data: me } = await supabase.rpc("my_profile");
  const onboardedAt = me?.[0]?.onboarded_at ?? new Date().toISOString();

  const { error } = await supabase
    .from("profiles")
    .update({ ...fields, onboarded_at: onboardedAt })
    .eq("id", uid);
  if (error) {
    if (error.code === "23505") {
      return { errors: { username: "Ese nombre de usuario ya está en uso." }, message: "Revisa los campos marcados." };
    }
    console.error("saveProfile", error.code, error.message);
    return { message: "No hemos podido guardar tu perfil. Inténtalo de nuevo." };
  }

  const [topicsRes, goalsRes, privacyRes] = await Promise.all([
    supabase.rpc("set_my_topics", { p_items: topics }),
    supabase.rpc("set_my_goals", { p_goals: goals as UserGoal[] }),
    supabase.from("profile_privacy").upsert({ profile_id: uid, ...privacy, updated_at: new Date().toISOString() }),
  ]);
  if (topicsRes.error) {
    return { errors: { topics: dbErrorMessage(topicsRes.error, "No hemos podido guardar tus temas.") }, message: "Revisa los campos marcados." };
  }
  if (goalsRes.error || privacyRes.error) {
    console.error("saveProfile extras", goalsRes.error?.message, privacyRes.error?.message);
    return { message: "Se guardó tu perfil, pero no los objetivos o la privacidad. Inténtalo de nuevo." };
  }

  revalidatePath("/", "layout");
  if (mode === "onboarding") redirect("/explorar?bienvenida=1");
  return { ok: true, message: "Perfil actualizado." };
}

export type TopicSuggestion = { id: number; slug: string; name: string; area: string; pending: boolean; via: string | null };

/** Autocompletado y corrección en el servidor (sinónimos y parecido por trigramas). */
export async function suggestTopicsAction(q: string): Promise<TopicSuggestion[]> {
  const query = String(q ?? "").trim().slice(0, 60);
  if (query.length < 3) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("search_topics", { p_query: query, p_limit: 6 });
  return (data ?? []).map((t) => ({ id: t.id, slug: t.slug, name: t.name, area: t.area_slug, pending: t.status === "pending", via: t.via }));
}

/**
 * Propone un tema nuevo. Si existe uno equivalente (mismo nombre o sinónimo)
 * devuelve ese; si no, queda pendiente de revisión por el equipo y ya se puede usar en el propio perfil.
 */
export async function proposeTopicAction(
  name: string,
  area: string,
): Promise<{ ok: boolean; message?: string; topic?: TopicSuggestion }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Tu sesión ha caducado." };
  const { data: id, error } = await supabase.rpc("propose_topic", { p_name: String(name).slice(0, 80), p_area: String(area).slice(0, 40) });
  if (error || !id) return { ok: false, message: dbErrorMessage(error, "No se pudo proponer el tema.") };
  const { data: t } = await supabase.from("topics").select("id, slug, name, area_slug, status").eq("id", id).maybeSingle();
  if (!t) return { ok: false, message: "No se pudo proponer el tema." };
  return { ok: true, topic: { id: t.id, slug: t.slug, name: t.name, area: t.area_slug, pending: t.status === "pending", via: null } };
}

const COVER_TYPES = /^image\/(webp|jpeg|png)$/;

/** Portada del perfil (reducida en el navegador). Se guarda en la carpeta propia del bucket «covers». */
export async function uploadProfileCoverAction(fd: FormData): Promise<{ ok: boolean; path?: string; message?: string }> {
  const file = fd.get("cover");
  if (!(file instanceof File) || !COVER_TYPES.test(file.type) || file.size > 5 * 1024 * 1024) {
    return { ok: false, message: "Imagen JPG, PNG o WebP de hasta 5 MB." };
  }
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Sesión caducada." };
  const uid = auth.user.id;
  const { data: me } = await supabase.rpc("my_profile");
  const previous = me?.[0]?.cover_path ?? null;
  const path = `${uid}/perfil-${randomUUID()}.webp`;
  const { error: upErr } = await supabase.storage.from("covers").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (upErr) return { ok: false, message: "No se pudo subir la imagen." };
  const { error } = await supabase.from("profiles").update({ cover_path: path }).eq("id", uid);
  if (error) {
    await supabase.storage.from("covers").remove([path]);
    return { ok: false, message: "No se pudo guardar la portada." };
  }
  // Solo se borra la portada de perfil anterior: la carpeta también guarda portadas de círculos y proyectos.
  if (previous?.startsWith(`${uid}/perfil-`)) await supabase.storage.from("covers").remove([previous]);
  revalidatePath("/", "layout");
  return { ok: true, path };
}

export async function removeProfileCoverAction(): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Sesión caducada." };
  const uid = auth.user.id;
  const { data: me } = await supabase.rpc("my_profile");
  const previous = me?.[0]?.cover_path ?? null;
  const { error } = await supabase.from("profiles").update({ cover_path: null }).eq("id", uid);
  if (error) return { ok: false, message: "No se pudo quitar la portada." };
  if (previous?.startsWith(`${uid}/perfil-`)) await supabase.storage.from("covers").remove([previous]);
  revalidatePath("/", "layout");
  return { ok: true };
}

const AVATAR_TYPES = /^image\/(webp|jpeg|png)$/;

/** Sube el avatar (ya reducido en el navegador) a la carpeta propia y lo asigna al perfil. */
export async function uploadAvatarAction(fd: FormData): Promise<{ ok: boolean; url?: string; message?: string }> {
  const file = fd.get("avatar");
  if (!(file instanceof File) || !AVATAR_TYPES.test(file.type) || file.size > 2 * 1024 * 1024) {
    return { ok: false, message: "Imagen no válida (máx. 2 MB)." };
  }
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Sesión caducada." };
  const uid = auth.user.id;
  const path = `${uid}/${Date.now()}.webp`;
  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (upErr) return { ok: false, message: "No se pudo subir la imagen." };
  const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", uid);
  if (error) {
    await supabase.storage.from("avatars").remove([path]);
    return { ok: false, message: "No se pudo guardar la imagen." };
  }
  await cleanupAvatars(supabase, uid, path);
  revalidatePath("/", "layout");
  return { ok: true, url };
}

export async function removeAvatarAction(): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Sesión caducada." };
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", auth.user.id);
  if (error) return { ok: false, message: "No se pudo quitar la imagen." };
  await cleanupAvatars(supabase, auth.user.id, null);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Borra avatares antiguos para no acumular almacenamiento. */
async function cleanupAvatars(supabase: Awaited<ReturnType<typeof createClient>>, uid: string, keep: string | null) {
  const { data } = await supabase.storage.from("avatars").list(uid, { limit: 100 });
  const stale = (data ?? []).map((f) => `${uid}/${f.name}`).filter((p) => p !== keep);
  if (stale.length) await supabase.storage.from("avatars").remove(stale);
}
