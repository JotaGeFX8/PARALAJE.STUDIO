/** Mapa central de rutas. Fuente única para navegación y protección. */
export const PRIVATE_PREFIXES = [
  "/explorar",
  "/comunidad",
  "/conexiones",
  "/circulos",
  "/proyectos",
  "/agora",
  "/perfil",
  "/miembros",
  "/ajustes",
  "/bienvenida",
] as const;

export const AUTH_PAGES = ["/acceso", "/registro", "/recuperar"] as const;

export function isPrivatePath(path: string) {
  return PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

export function isAuthPagePath(path: string) {
  return (AUTH_PAGES as readonly string[]).includes(path);
}

/** Evita redirecciones abiertas: solo rutas internas privadas. */
export function safeNext(next: string | null | undefined, fallback = "/explorar") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return isPrivatePath(next.split("?")[0]) ? next : fallback;
}
