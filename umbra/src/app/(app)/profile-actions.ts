"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { profileSchema, readProfileForm } from "@/lib/validation/profile";

/** Guarda el perfil completo (bienvenida y edición). */
export async function saveProfileAction(_: FormState, formData: FormData): Promise<FormState> {
  const mode = formData.get("mode") === "edit" ? "edit" : "onboarding";
  const parsed = profileSchema.safeParse(readProfileForm(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), message: "Revisa los campos marcados." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { message: "Tu sesión ha caducado. Vuelve a entrar." };

  const { interests, favorites, ...fields } = parsed.data;

  const { data: current } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", auth.user.id)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ ...fields, onboarded_at: current?.onboarded_at ?? new Date().toISOString() })
    .eq("id", auth.user.id);

  if (error) {
    if (error.code === "23505") {
      return { errors: { username: "Ese nombre de usuario ya está en uso." }, message: "Revisa los campos marcados." };
    }
    console.error("saveProfile", error.code, error.message);
    return { message: "No hemos podido guardar tu perfil. Inténtalo de nuevo." };
  }

  const { error: intErr } = await supabase.rpc("set_my_interests", {
    p_interests: interests,
    p_favorites: favorites,
  });
  if (intErr) {
    console.error("setInterests", intErr.code, intErr.message);
    return { errors: { interests: "No hemos podido guardar tus intereses." }, message: "Revisa los campos marcados." };
  }

  revalidatePath("/", "layout");
  if (mode === "onboarding") redirect("/explorar?bienvenida=1");
  return { ok: true, message: "Perfil actualizado." };
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
