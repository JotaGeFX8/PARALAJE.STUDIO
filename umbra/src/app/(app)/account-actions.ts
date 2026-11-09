"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { newPasswordSchema } from "@/lib/validation/auth";

export async function changePasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { message: "Sesión caducada. Vuelve a entrar." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { errors: { password: "Debe ser distinta de la actual." } };
    if (error.code === "reauthentication_needed")
      return { message: "Por seguridad, cierra sesión y vuelve a entrar antes de cambiarla." };
    return { message: "No hemos podido cambiar la contraseña." };
  }
  return { ok: true, message: "Contraseña actualizada." };
}

export async function deleteAccountAction(_: FormState, formData: FormData): Promise<FormState> {
  const confirm = String(formData.get("confirm") ?? "").trim().replace(/^@/, "");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { message: "Sesión caducada. Vuelve a entrar." };

  // Primero, los archivos propios (avatares).
  const { data: files } = await supabase.storage.from("avatars").list(data.user.id, { limit: 100 });
  if (files?.length) {
    await supabase.storage.from("avatars").remove(files.map((f) => `${data.user.id}/${f.name}`));
  }

  const { error } = await supabase.rpc("delete_my_account", { p_confirm_username: confirm });
  if (error) {
    if (error.code === "22023") return { errors: { confirm: "Escribe exactamente tu nombre de usuario." } };
    if (error.code === "42501") return { message: error.message };
    return { message: "No hemos podido eliminar la cuenta. Inténtalo de nuevo." };
  }
  await supabase.auth.signOut();
  redirect("/?cuenta=eliminada");
}
