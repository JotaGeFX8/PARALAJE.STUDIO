"use client";

import { useEffect } from "react";
import { applyTheme, THEME_COOKIE, type ThemeKey } from "@/lib/theme";

/** Mantiene la cookie del tema igual que la preferencia guardada en la cuenta (p. ej. al entrar desde otro dispositivo). */
export function ThemeSync({ theme }: { theme: ThemeKey }) {
  useEffect(() => {
    const current = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=(\\w+)`))?.[1];
    if (current !== theme) applyTheme(theme);
  }, [theme]);
  return null;
}
