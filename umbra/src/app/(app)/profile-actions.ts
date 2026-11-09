"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/env";
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

/** Registra (o elimina) la URL del avatar ya subido a Storage. */
export async function setAvatarAction(url: string | null): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Sesión caducada." };

  if (url !== null) {
    // Solo se aceptan archivos de la carpeta propia del bucket de avatares.
    const prefix = `${SUPABASE_URL}/storage/v1/object/public/avatars/${auth.user.id}/`;
    if (!url.startsWith(prefix) || !/^[\w./-]+$/.test(url.slice(prefix.length))) {
      return { ok: false, message: "Imagen no válida." };
    }
  }

  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", auth.user.id);
  if (error) return { ok: false, message: "No se pudo guardar la imagen." };
  revalidatePath("/", "layout");
  return { ok: true };
}
