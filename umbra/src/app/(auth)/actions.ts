"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL, isSupabaseConfigured } from "@/lib/env";
import { safeNext } from "@/lib/routes";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { newPasswordSchema, resetSchema, signInSchema, signUpSchema } from "@/lib/validation/auth";

const NOT_CONFIGURED: FormState = {
  message: "El servidor aún no está conectado a Supabase. Revisa la configuración (.env.local).",
};

export async function signUpAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { email: raw.email ?? "" } };

  const supabase = await createClient();
  const { data: settings } = await supabase.from("site_settings").select("registration_open").maybeSingle();
  if (settings && !settings.registration_open) {
    return { message: "El registro está cerrado temporalmente. Vuelve a intentarlo más adelante.", values: { email: raw.email ?? "" } };
  }
  // Campo trampa invisible: si un bot lo rellena, fingimos éxito sin crear nada.
  if (raw.website) return { ok: true, values: { email: parsed.data.email } };
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${SITE_URL}/auth/confirm?next=/bienvenida` },
  });

  if (error) {
    if (error.status === 429) {
      return { message: "Demasiados intentos. Espera unos minutos antes de volver a probar." };
    }
    if (error.code === "weak_password") {
      return { errors: { password: "Contraseña demasiado débil. Prueba con una más larga." } };
    }
    console.error("signUp", error.code, error.message);
    return { message: "No hemos podido crear la cuenta. Inténtalo de nuevo en unos minutos." };
  }

  // Si Supabase no exige confirmar el correo, la cuenta ya tiene sesión: directo a la bienvenida.
  if (data.session) redirect("/bienvenida");

  // Por privacidad, la respuesta es idéntica exista o no ya el correo.
  return { ok: true, values: { email: parsed.data.email } };
}

export async function signInAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { email: raw.email ?? "" } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const values = { email: parsed.data.email };
    if (error.code === "email_not_confirmed") {
      return { values, message: "Aún no has confirmado tu correo. Revisa tu bandeja de entrada (y el spam)." };
    }
    if (error.status === 429) return { values, message: "Demasiados intentos. Espera unos minutos." };
    return { values, message: "Correo o contraseña incorrectos." };
  }
  redirect(safeNext(raw.next));
}

export async function requestResetAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/confirm?next=/nueva-contrasena`,
  });
  if (error?.status === 429) return { message: "Demasiadas solicitudes. Espera unos minutos." };
  if (error) console.error("resetPassword", error.code, error.message);
  // Respuesta neutra: no revela si el correo existe.
  return { ok: true };
}

export async function updatePasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { message: "El enlace ha caducado. Solicita uno nuevo desde «¿Olvidaste tu contraseña?»." };
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { errors: { password: "Debe ser distinta de la anterior." } };
    return { message: "No hemos podido cambiar la contraseña. Inténtalo de nuevo." };
  }
  redirect("/explorar");
}
