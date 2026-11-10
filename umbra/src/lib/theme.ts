/** Tema visual: «light» (claro), «dark» (oscuro) o «system» (según el dispositivo). */
export const THEMES = [
  { key: "light", label: "Claro" },
  { key: "dark", label: "Oscuro" },
  { key: "system", label: "Automático" },
] as const;
export type ThemeKey = (typeof THEMES)[number]["key"];
export const THEME_COOKIE = "umbra-theme";

/** Aplica el tema al instante en el navegador y lo recuerda en una cookie (un año). */
export function applyTheme(theme: ThemeKey) {
  document.documentElement.setAttribute("data-theme", theme);
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}
