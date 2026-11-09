import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";
import { isPrivatePath } from "@/lib/routes";

/**
 * Refresca la sesión en cada navegación y aplica una comprobación optimista:
 * - rutas privadas sin sesión → /acceso
 * La autorización real se repite en el servidor (layout privado + RLS).
 * Nota: la redirección «ya tienes sesión» de /acceso y /registro se hace en
 * su layout con la sesión verificada; hacerlo aquí con un token local que el
 * servidor de Auth ya revocó (p. ej. tras cambiar la contraseña en otro
 * dispositivo) provocaría un bucle de redirecciones.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  if (!isSupabaseConfigured) {
    if (isPrivatePath(path)) return redirectTo(request, "/acceso");
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // No insertar lógica entre createServerClient y getClaims().
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  if (!signedIn && isPrivatePath(path)) {
    const target = redirectTo(request, "/acceso", path + request.nextUrl.search);
    copyCookies(response, target);
    return target;
  }
  return response;
}

/**
 * Redirección absoluta construida con el host que ve el navegador (cabeceras
 * x-forwarded-* de un proxy, si las hay), para no redirigir a un host interno.
 */
function redirectTo(request: NextRequest, pathname: string, next?: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const origin = host ? `${proto}://${host}` : request.nextUrl.origin;
  const url = new URL(pathname, origin);
  if (next) url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => to.cookies.set(c));
}
