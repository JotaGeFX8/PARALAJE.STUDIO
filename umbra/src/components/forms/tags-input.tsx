"use client";

import { useId, useState } from "react";

/**
 * Lista de etiquetas libres (p. ej. habilidades): se añaden con Intro, coma o
 * el botón, y viajan al formulario como campos ocultos con el mismo nombre.
 */
export function TagsInput({
  name,
  label,
  initial,
  max,
  maxLength = 40,
  placeholder,
  hint,
  error,
}: {
  name: string;
  label: string;
  initial: string[];
  max: number;
  maxLength?: number;
  placeholder?: string;
  hint?: string;
  error?: string;
}) {
  const id = useId();
  const [items, setItems] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.replace(/,/g, " ").trim().slice(0, maxLength);
    setDraft("");
    if (v.length < 2 || items.length >= max) return;
    if (items.some((x) => x.toLocaleLowerCase("es") === v.toLocaleLowerCase("es"))) return;
    setItems([...items, v]);
  }

  return (
    <div>
      <label htmlFor={id} className="label block">
        {label}
      </label>
      {items.map((s) => (
        <input key={s} type="hidden" name={name} value={s} />
      ))}
      {items.length > 0 && (
        <ul className="mb-2 mt-3 flex flex-wrap gap-1.5">
          {items.map((s) => (
            <li key={s} className="flex items-center gap-1 rounded-full bg-accent-soft py-0.5 pl-3 pr-1 text-[0.875rem] text-accent-strong">
              {s}
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-full hover:bg-canvas"
                aria-label={`Quitar ${s}`}
                onClick={() => setItems(items.filter((x) => x !== s))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <input
          id={id}
          value={draft}
          maxLength={maxLength}
          placeholder={items.length >= max ? `Máximo ${max}` : placeholder}
          disabled={items.length >= max}
          onChange={(e) => {
            if (e.target.value.endsWith(",")) {
              setDraft(e.target.value);
              return add();
            }
            setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          aria-describedby={hint ? `${id}-h` : undefined}
          className="field"
        />
        <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={add} disabled={!draft.trim() || items.length >= max}>
          Añadir
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-h`} className="mt-2 text-sm text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
