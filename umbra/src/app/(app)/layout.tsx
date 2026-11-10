import { requireMember } from "@/lib/auth";
import { Wordmark } from "@/components/ui/logo";
import { SignOutButton } from "@/components/shell/sign-out";
import { ThemeSync } from "@/components/shell/theme-sync";
import { createClient } from "@/lib/supabase/server";
import type { ThemeKey } from "@/lib/theme";

/**
 * Zona privada. Segunda barrera tras el proxy: verifica la sesión contra
 * Supabase Auth y bloquea cuentas suspendidas o expulsadas.
 */
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireMember();

  if (profile.status !== "active") {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-5 py-16">
        <Wordmark className="text-ink" />
        <h1 className="display mt-12 text-4xl text-ink">
          {profile.status === "suspended" ? "Cuenta suspendida." : "Cuenta cerrada."}
        </h1>
        <p className="mt-5 font-serif text-lg leading-relaxed text-ink-2">
          Tu acceso a la comunidad está restringido por una decisión de moderación. Si crees que es un error,
          puedes solicitar una revisión respondiendo al correo que recibiste.
        </p>
        <SignOutButton className="mt-10" />
      </main>
    );
  }
  const supabase = await createClient();
  const { data: settings } = await supabase.from("user_settings").select("theme").eq("profile_id", profile.id).maybeSingle();
  return (
    <>
      <ThemeSync theme={(settings?.theme ?? "light") as ThemeKey} />
      {children}
    </>
  );
}
