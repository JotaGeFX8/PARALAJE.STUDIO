import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/routes";

/**
 * Destino de los enlaces de correo (confirmación de cuenta y recuperación).
 * Admite los dos formatos de Supabase:
 *  - token_hash + type (plantillas personalizadas; funciona en cualquier dispositivo)
 *  - code (flujo PKCE por defecto; mismo navegador que inició el registro)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const next =
    type === "recovery" || rawNext === "/nueva-contrasena" ? "/nueva-contrasena" : safeNext(rawNext, "/bienvenida");

  const supabase = await createClient();
  let ok = false;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  // Redirecciones relativas: válidas detrás de cualquier proxy o dominio.
  const location = ok ? next : "/acceso?error=enlace";
  return new NextResponse(null, { status: 303, headers: { Location: location } });
}
