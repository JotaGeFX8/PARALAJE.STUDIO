"use client";

import { useDeferredValue, useEffect, useId, useMemo, useState, useTransition } from "react";
import { proposeTopicAction, suggestTopicsAction, type TopicSuggestion } from "@/app/(app)/profile-actions";
import { TOPIC_RELATIONS, type TopicRelationKey } from "@/lib/content";
import type { CatalogArea, CatalogTopic } from "@/lib/data/catalog";
import { MAX_PRIMARY, MAX_TOPICS } from "@/lib/validation/profile";
import { IconSearch } from "@/components/ui/icons";

export type TopicChoice = { topic_id: number; relation: TopicRelationKey; is_primary: boolean };

/** Minúsculas y sin tildes, para buscar «cuantica» y encontrar «Cuántica». */
export function fold(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

type Hit = { topic: CatalogTopic; via: string | null; score: number };

export function searchCatalog(topics: CatalogTopic[], q: string, limit = 12): Hit[] {
  const v = fold(q);
  if (!v) return [];
  const hits: Hit[] = [];
  for (const t of topics) {
    const name = fold(t.name);
    let score = 0;
    let via: string | null = null;
    if (name.startsWith(v)) score = 4;
    else if (name.split(/[\s-]+/).some((w) => w.startsWith(v))) score = 3;
    else if (name.includes(v)) score = 2;
    else {
      const syn = t.synonyms.find((s) => fold(s).startsWith(v) || fold(s).includes(v));
      if (syn) {
        score = 2;
        via = syn;
      }
    }
    if (score) hits.push({ topic: t, via, score });
  }
  return hits.sort((a, b) => b.score - a.score || a.topic.name.length - b.topic.name.length).slice(0, limit);
}

/**
 * Selector de temas: buscador (nombre y sinónimos, sin tildes), recorrido por
 * las 22 áreas y propuesta de temas nuevos (quedan pendientes de revisión).
 */
export function TopicPicker({
  areas,
  topics,
  chosen,
  onToggle,
  onProposed,
  error,
}: {
  areas: CatalogArea[];
  topics: CatalogTopic[];
  chosen: TopicChoice[];
  onToggle: (topicId: number) => void;
  onProposed: (topic: CatalogTopic) => void;
  error?: string;
}) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [proposeArea, setProposeArea] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const chosenIds = useMemo(() => new Set(chosen.map((c) => c.topic_id)), [chosen]);
  const hits = useMemo(() => searchCatalog(topics, deferred), [topics, deferred]);
  const areaName = useMemo(() => new Map(areas.map((a) => [a.slug, a.name])), [areas]);
  const full = chosen.length >= MAX_TOPICS;

  // Sin coincidencias locales: el servidor busca por parecido (corrige erratas).
  const term = deferred.trim();
  useEffect(() => {
    if (hits.length || term.length < 3) return;
    let alive = true;
    const t = setTimeout(async () => {
      const r = await suggestTopicsAction(term);
      if (alive) setSuggestions(r);
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [term, hits.length]);
  const visibleSuggestions = hits.length || term.length < 3 ? [] : suggestions;

  const countByArea = useMemo(() => {
    const byId = new Map(topics.map((t) => [t.id, t]));
    const m = new Map<string, number>();
    for (const c of chosen) {
      const t = byId.get(c.topic_id);
      if (t) m.set(t.area, (m.get(t.area) ?? 0) + 1);
    }
    return m;
  }, [chosen, topics]);

  function propose() {
    const name = query.trim();
    if (name.length < 2 || !proposeArea) return;
    setNotice(null);
    start(async () => {
      const r = await proposeTopicAction(name, proposeArea);
      if (!r.ok || !r.topic) return setNotice(r.message ?? "No se pudo proponer el tema.");
      const t = r.topic;
      onProposed({ id: t.id, slug: t.slug, name: t.name, area: t.area, also: [], synonyms: [], pending: t.pending });
      setNotice(
        t.pending
          ? `«${t.name}» queda propuesto y ya está en tu perfil. El equipo lo revisará.`
          : `Ya existía: hemos añadido «${t.name}».`,
      );
      setQuery("");
    });
  }

  const chip = (t: CatalogTopic, via?: string | null) => {
    const on = chosenIds.has(t.id);
    return (
      <button
        key={t.id}
        type="button"
        className="chip !min-h-9 !px-3 !text-[0.875rem]"
        aria-pressed={on}
        disabled={!on && full}
        onClick={() => onToggle(t.id)}
      >
        {t.name}
        {t.pending && <span className="text-[0.6875rem] text-muted">· pendiente</span>}
        {via && <span className="text-[0.6875rem] text-muted">· «{via}»</span>}
      </button>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <label htmlFor={searchId} className="label block">
          Buscar un tema
        </label>
        <div className="flex items-center gap-3 border-b border-line-2 focus-within:border-accent">
          <IconSearch size={18} className="shrink-0 text-muted" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setNotice(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // no enviar el formulario
                if (hits[0] && !chosenIds.has(hits[0].topic.id) && !full) {
                  onToggle(hits[0].topic.id);
                  setQuery("");
                }
              }
            }}
            placeholder="cuántica, huerto, ovnis, cerámica…"
            autoComplete="off"
            maxLength={60}
            className="min-h-12 w-full bg-transparent text-[1.0625rem] outline-none"
          />
        </div>

        {term && (
          <div className="mt-4 animate-rise" aria-live="polite">
            {hits.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {hits.map((h) => (
                  <li key={h.topic.id} className="flex items-center gap-1">
                    {chip(h.topic, h.via)}
                    <span className="hidden text-xs text-muted sm:inline">{areaName.get(h.topic.area)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-4 rounded-xl bg-surface-2 p-4">
                {visibleSuggestions.length > 0 && (
                  <div>
                    <p className="text-sm text-ink-2">¿Quizá buscabas…?</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {visibleSuggestions.map((s) => {
                        const t = topics.find((x) => x.id === s.id);
                        return t ? chip(t, s.via) : null;
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-ink-2">
                    No está «{term}» en el catálogo. Puedes proponerlo: lo usarás desde ya y el equipo lo revisará para evitar
                    duplicados.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <label className="sr-only" htmlFor={`${searchId}-area`}>
                      Área del tema nuevo
                    </label>
                    <select
                      id={`${searchId}-area`}
                      value={proposeArea}
                      onChange={(e) => setProposeArea(e.target.value)}
                      className="field !min-h-10 sm:max-w-xs"
                    >
                      <option value="">Elige su área…</option>
                      {areas.map((a) => (
                        <option key={a.slug} value={a.slug}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={pending || !proposeArea || term.length < 2 || full}
                      onClick={propose}
                    >
                      {pending ? "Proponiendo…" : `Proponer «${term.slice(0, 40)}»`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {notice && (
          <p role="status" className="mt-3 text-sm text-accent-strong">
            {notice}
          </p>
        )}
      </div>

      <div>
        <p className="label mb-3">O recorre las áreas</p>
        <div className="border-t hairline">
          {areas.map((a) => {
            const list = topics.filter((t) => t.area === a.slug || t.also.includes(a.slug));
            const n = countByArea.get(a.slug) ?? 0;
            return (
              <details key={a.slug} name="areas" className="group border-b hairline">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="font-serif text-[1.0625rem] text-ink">{a.name}</span>
                  <span className="flex shrink-0 items-center gap-2 text-sm text-muted">
                    {n > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-on-accent">{n}</span>}
                    <span aria-hidden="true" className="transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <div className="pb-5">
                  {a.description && <p className="mb-3 text-sm text-muted">{a.description}</p>}
                  <div className="flex flex-wrap gap-1.5">{list.map((t) => chip(t))}</div>
                </div>
              </details>
            );
          })}
        </div>
      </div>
      {full && <p className="text-sm text-muted">Has llegado al máximo de {MAX_TOPICS} temas.</p>}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Relación con cada tema elegido y hasta cinco temas principales. */
export function TopicRelations({
  areas,
  topics,
  chosen,
  onChange,
  onRemove,
  onPickMore,
}: {
  areas: CatalogArea[];
  topics: CatalogTopic[];
  chosen: TopicChoice[];
  onChange: (topicId: number, patch: Partial<TopicChoice>) => void;
  onRemove: (topicId: number) => void;
  onPickMore?: () => void;
}) {
  const byId = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const primaries = chosen.filter((c) => c.is_primary).length;
  const groups = areas
    .map((a) => ({ area: a, items: chosen.filter((c) => byId.get(c.topic_id)?.area === a.slug) }))
    .filter((g) => g.items.length);

  if (!chosen.length) {
    return (
      <div className="rounded-xl bg-surface-2 p-5 text-[0.9375rem] text-ink-2">
        Aún no has elegido temas.
        {onPickMore && (
          <button type="button" className="link ml-1" onClick={onPickMore}>
            Elegir temas
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        <span aria-hidden="true" className="text-accent">
          ✦
        </span>{" "}
        Principales: {primaries}/{MAX_PRIMARY}. Aparecen primero en tu perfil y pesan más en las recomendaciones.
      </p>
      <div className="space-y-7">
        {groups.map((g) => (
          <section key={g.area.slug}>
            <h3 className="label mb-2">{g.area.name}</h3>
            <ul className="border-t hairline">
              {g.items.map((c) => {
                const t = byId.get(c.topic_id)!;
                return (
                  <li key={c.topic_id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b hairline py-3">
                    <span className="min-w-0 flex-1 basis-40 text-[1rem] text-ink">
                      {t.name}
                      {t.pending && <span className="ml-1.5 text-xs text-muted">pendiente</span>}
                    </span>
                    <label className="sr-only" htmlFor={`rel-${c.topic_id}`}>
                      Relación con {t.name}
                    </label>
                    <select
                      id={`rel-${c.topic_id}`}
                      value={c.relation}
                      onChange={(e) => onChange(c.topic_id, { relation: e.target.value as TopicRelationKey })}
                      className="field !min-h-10 !w-auto !py-1 text-[0.9375rem]"
                    >
                      {TOPIC_RELATIONS.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="grid h-10 w-10 place-items-center rounded-full text-lg transition-colors hover:bg-surface-2 disabled:opacity-40"
                      aria-pressed={c.is_primary}
                      aria-label={c.is_primary ? `Quitar ${t.name} de principales` : `Marcar ${t.name} como principal`}
                      title="Tema principal"
                      disabled={!c.is_primary && primaries >= MAX_PRIMARY}
                      onClick={() => onChange(c.topic_id, { is_primary: !c.is_primary })}
                    >
                      <span className={c.is_primary ? "text-accent" : "text-muted"}>✦</span>
                    </button>
                    <button
                      type="button"
                      className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-danger"
                      aria-label={`Quitar ${t.name}`}
                      onClick={() => onRemove(c.topic_id)}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
