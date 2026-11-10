"use client";

import { useState, useTransition } from "react";
import { saveThemeAction } from "@/app/(app)/account-actions";
import { applyTheme, THEMES, type ThemeKey } from "@/lib/theme";

/** Selector de tema: se aplica al momento y se guarda en la cuenta. */
export function ThemePicker({ initial }: { initial: ThemeKey }) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  return (
    <fieldset>
      <legend className="sr-only">Tema</legend>
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map((t) => (
          <label
            key={t.key}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 text-sm transition-colors ${
              value === t.key ? "border-accent bg-accent-soft text-accent-strong" : "border-line-2 text-ink-2 hover:border-accent-mid"
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={t.key}
              checked={value === t.key}
              className="sr-only"
              onChange={() => {
                const prev = value;
                setValue(t.key);
                setError(null);
                applyTheme(t.key);
                start(async () => {
                  const r = await saveThemeAction(t.key);
                  if (!r.ok) {
                    setValue(prev);
                    applyTheme(prev);
                    setError(r.message ?? "No se pudo guardar.");
                  }
                });
              }}
            />
            <span
              aria-hidden="true"
              className={`h-10 w-full rounded-lg border border-line-2 ${
                t.key === "light" ? "bg-[#f7f9f7]" : t.key === "dark" ? "bg-[#111713]" : "bg-[linear-gradient(135deg,#f7f9f7_50%,#111713_50%)]"
              }`}
            />
            {t.label}
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </fieldset>
  );
}
