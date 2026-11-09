"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import type { CatalogArea, CatalogTopic } from "@/lib/data/catalog";
import { searchCatalog } from "@/components/profile/topic-picker";

/**
 * Selección compacta de temas del catálogo (proyectos, círculos, libros…):
 * buscador con sinónimos y sin tildes; los elegidos viajan como campos ocultos `name`.
 */
export function TopicMultiSelect({
  name,
  label,
  hint,
  areas,
  topics,
  initial,
  max,
  error,
  preferArea,
}: {
  name: string;
  label: string;
  hint?: string;
  areas: CatalogArea[];
  topics: CatalogTopic[];
  initial: number[];
  max: number;
  error?: string;
  /** Área sugerida: sus temas se muestran como atajos. */
  preferArea?: string | null;
}) {
  const id = useId();
  const [chosen, setChosen] = useState<number[]>(initial);
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const byId = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const areaName = useMemo(() => new Map(areas.map((a) => [a.slug, a.name])), [areas]);
  const hits = useMemo(() => searchCatalog(topics.filter((t) => !t.pending), deferred, 8), [topics, deferred]);
  const shortcuts = useMemo(
    () => (preferArea && !deferred ? topics.filter((t) => t.area === preferArea && !t.pending).slice(0, 14) : []),
    [topics, preferArea, deferred],
  );
  const full = chosen.length >= max;

  function toggle(tid: number) {
    setChosen((c) => (c.includes(tid) ? c.filter((x) => x !== tid) : c.length >= max ? c : [...c, tid]));
  }

  const option = (t: CatalogTopic, via?: string | null) => {
    const on = chosen.includes(t.id);
    return (
      <button
        key={t.id}
        type="button"
        className="chip !min-h-8 !px-3 !text-[0.8125rem]"
        aria-pressed={on}
        disabled={!on && full}
        onClick={() => toggle(t.id)}
        title={areaName.get(t.area)}
      >
        {t.name}
        {via && <span className="text-[0.6875rem] text-muted">· «{via}»</span>}
      </button>
    );
  };

  return (
    <fieldset>
      <legend className="label mb-2">
        {label} · {chosen.length}/{max}
      </legend>
      {chosen.map((c) => (
        <input key={c} type="hidden" name={name} value={c} />
      ))}
      {chosen.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-1.5">
          {chosen.map((c) => {
            const t = byId.get(c);
            if (!t) return null;
            return (
              <li key={c} className="flex items-center gap-1 rounded-full bg-accent-soft py-0.5 pl-3 pr-1 text-[0.875rem] text-accent-strong">
                {t.name}
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-full hover:bg-canvas"
                  aria-label={`Quitar ${t.name}`}
                  onClick={() => toggle(c)}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <label htmlFor={id} className="sr-only">
        Buscar tema para {label}
      </label>
      <input
        id={id}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (hits[0] && !full) {
              toggle(hits[0].topic.id);
              setQuery("");
            }
          }
        }}
        placeholder={full ? `Máximo ${max}` : "Escribe para buscar un tema…"}
        disabled={full}
        autoComplete="off"
        className="field"
      />
      {(hits.length > 0 || shortcuts.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {hits.length > 0 ? hits.map((h) => option(h.topic, h.via)) : shortcuts.map((t) => option(t))}
        </div>
      )}
      {deferred.trim() && hits.length === 0 && (
        <p className="mt-2 text-sm text-muted">Sin coincidencias en el catálogo. Puedes proponer temas nuevos desde tu perfil.</p>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-2 text-sm text-muted">{hint}</p>
      )}
    </fieldset>
  );
}
