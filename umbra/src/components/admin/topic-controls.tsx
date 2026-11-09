"use client";

import { useState, useTransition } from "react";
import { addSynonymAction, mergeTopicAction, reviewTopicAction } from "@/app/(app)/actions/admin";
import type { CatalogArea, CatalogTopic } from "@/lib/data/catalog";

type R = { ok: boolean; message?: string };

function TopicSelect({
  id,
  areas,
  topics,
  value,
  onChange,
  exclude,
}: {
  id: string;
  areas: CatalogArea[];
  topics: CatalogTopic[];
  value: string;
  onChange: (v: string) => void;
  exclude?: number;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field !min-h-10 !py-1 text-sm">
      <option value="">Elige un tema…</option>
      {areas.map((a) => (
        <optgroup key={a.slug} label={a.name}>
          {topics
            .filter((t) => t.area === a.slug && !t.pending && t.id !== exclude)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}

/** Propuesta pendiente: aprobar (con su área), rechazar o fusionar en un tema existente. */
export function TopicReview({
  topic,
  areas,
  topics,
  canMerge,
}: {
  topic: { id: number; name: string; area_slug: string };
  areas: CatalogArea[];
  topics: CatalogTopic[];
  canMerge: boolean;
}) {
  const [area, setArea] = useState(topic.area_slug);
  const [into, setInto] = useState("");
  const [result, setResult] = useState<R | null>(null);
  const [pending, start] = useTransition();
  if (result?.ok) return <span className="label text-accent">Hecho</span>;
  const run = (fn: () => Promise<R>) => start(async () => setResult(await fn()));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`area-${topic.id}`} className="sr-only">
          Área de {topic.name}
        </label>
        <select id={`area-${topic.id}`} value={area} onChange={(e) => setArea(e.target.value)} className="field !min-h-10 !w-auto !py-1 text-sm">
          {areas.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={() => run(() => reviewTopicAction(topic.id, true, area))}>
          Aprobar
        </button>
        <button type="button" className="btn btn-danger btn-sm" disabled={pending} onClick={() => run(() => reviewTopicAction(topic.id, false, ""))}>
          Rechazar
        </button>
      </div>
      {canMerge && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={`merge-${topic.id}`} className="text-sm text-muted">
            Es un duplicado de
          </label>
          <TopicSelect id={`merge-${topic.id}`} areas={areas} topics={topics} value={into} onChange={setInto} exclude={topic.id} />
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending || !into} onClick={() => run(() => mergeTopicAction(topic.id, Number(into)))}>
            Fusionar
          </button>
        </div>
      )}
      {result && !result.ok && <p className="text-sm text-danger">{result.message}</p>}
    </div>
  );
}

/** Herramientas sobre temas aprobados: sinónimos (equipo) y fusión de duplicados (administración). */
export function CatalogTools({ areas, topics, canMerge }: { areas: CatalogArea[]; topics: CatalogTopic[]; canMerge: boolean }) {
  const [synTopic, setSynTopic] = useState("");
  const [term, setTerm] = useState("");
  const [from, setFrom] = useState("");
  const [into, setInto] = useState("");
  const [msg, setMsg] = useState<R | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await addSynonymAction(Number(synTopic), term);
            setMsg(r.ok ? { ok: true, message: `Sinónimo «${term}» añadido.` } : r);
            if (r.ok) setTerm("");
          });
        }}
      >
        <h3 className="font-serif text-lg text-ink">Añadir sinónimo</h3>
        <p className="text-sm text-muted">El buscador encontrará el tema también por este término (p. ej. «fotovoltaica» → Energía solar).</p>
        <TopicSelect id="syn-topic" areas={areas} topics={topics} value={synTopic} onChange={setSynTopic} />
        <label htmlFor="syn-term" className="sr-only">
          Sinónimo
        </label>
        <input id="syn-term" value={term} onChange={(e) => setTerm(e.target.value)} maxLength={60} placeholder="Término equivalente" className="field" />
        <button type="submit" className="btn btn-ghost btn-sm" disabled={pending || !synTopic || term.trim().length < 2}>
          Añadir sinónimo
        </button>
      </form>
      {canMerge && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await mergeTopicAction(Number(from), Number(into));
              setMsg(r.ok ? { ok: true, message: "Temas fusionados: personas y proyectos se han movido al tema que se conserva." } : r);
              if (r.ok) {
                setFrom("");
                setInto("");
              }
            });
          }}
        >
          <h3 className="font-serif text-lg text-ink">Fusionar duplicados</h3>
          <p className="text-sm text-muted">El primero desaparece del catálogo, su nombre queda como sinónimo y sus miembros pasan al segundo.</p>
          <TopicSelect id="merge-from" areas={areas} topics={topics} value={from} onChange={setFrom} />
          <TopicSelect id="merge-into" areas={areas} topics={topics} value={into} onChange={setInto} exclude={Number(from) || undefined} />
          <button type="submit" className="btn btn-ghost btn-sm" disabled={pending || !from || !into}>
            Fusionar
          </button>
        </form>
      )}
      {msg && (
        <p role="status" className={`text-sm md:col-span-2 ${msg.ok ? "text-accent-strong" : "text-danger"}`}>
          {msg.message}
        </p>
      )}
    </div>
  );
}
