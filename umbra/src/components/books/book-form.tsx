"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { recommendBookAction, searchBooksAction, updateBookAction } from "@/app/(app)/actions/books";
import { initialFormState } from "@/lib/form-state";
import type { Catalog } from "@/lib/data/catalog";
import { FormMessage } from "@/components/forms/fields";
import { TopicMultiSelect } from "@/components/forms/topic-multiselect";
import { CoverPicker } from "@/components/groups/cover-picker";
import { RecommendationFields } from "./book-actions";

type Match = { id: string; slug: string; title: string; authors: string; year: number | null; rec_count: number };

/**
 * Formulario de libro.
 * - mode "new": ficha + recomendación propia (avisa si el libro ya existe).
 * - mode "edit": corrección de la ficha.
 */
export function BookForm({
  mode,
  catalog,
  initial,
}: {
  mode: "new" | "edit";
  catalog: Catalog;
  initial?: {
    id: string;
    title: string;
    authors: string;
    year: number | null;
    isbn: string | null;
    area_slug: string | null;
    topics: number[];
    cover_url: string | null;
  };
}) {
  const [state, formAction] = useActionState(mode === "new" ? recommendBookAction : updateBookAction, initialFormState);
  const [pending, start] = useTransition();
  const [cover, setCover] = useState<File | null>(null);
  const [title, setTitle] = useState(state.values?.title ?? initial?.title ?? "");
  const [area, setArea] = useState(initial?.area_slug ?? "");
  const [matches, setMatches] = useState<Match[]>([]);
  const e = state.errors ?? {};

  // Mientras se escribe el título, se buscan fichas existentes para no duplicarlas.
  useEffect(() => {
    if (mode !== "new") return;
    let alive = true;
    const t = setTimeout(async () => {
      const r = title.trim().length >= 3 ? await searchBooksAction(title) : [];
      if (alive) setMatches(r as Match[]);
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [title, mode]);

  return (
    <form
      noValidate
      className="space-y-9"
      onSubmit={(ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        fd.delete("cover");
        if (cover) fd.append("cover", cover);
        start(() => formAction(fd));
      }}
    >
      {initial && <input type="hidden" name="book_id" value={initial.id} />}
      <FormMessage message={state.message} />

      <div>
        <label htmlFor="b-title" className="label block">
          Título
        </label>
        <input
          id="b-title"
          name="title"
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          maxLength={200}
          autoComplete="off"
          className="field font-serif !text-2xl"
          placeholder="Cosmos, El jardín de los cerezos, Manual de construcción en tierra…"
        />
        {e.title && <p className="mt-2 text-sm text-danger">{e.title}</p>}
        {matches.length > 0 && (
          <div className="mt-3 rounded-xl bg-surface-2 p-4" aria-live="polite">
            <p className="text-sm text-ink-2">¿Es alguno de estos? Si ya está en la biblioteca, añade tu recomendación en su ficha:</p>
            <ul className="mt-2 space-y-1.5">
              {matches.map((m) => (
                <li key={m.id}>
                  <Link href={`/libros/${m.slug}#recomendar`} className="link text-[0.9375rem]">
                    {m.title}
                  </Link>
                  <span className="text-sm text-muted">
                    {" "}
                    · {m.authors}
                    {m.year ? `, ${m.year}` : ""} · {m.rec_count} {m.rec_count === 1 ? "recomendación" : "recomendaciones"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="b-authors" className="label block">
          Autoría · separa varias personas con comas
        </label>
        <input id="b-authors" name="authors" defaultValue={state.values?.authors ?? initial?.authors ?? ""} maxLength={200} className="field" placeholder="Carl Sagan" />
        {e.authors && <p className="mt-2 text-sm text-danger">{e.authors}</p>}
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <label htmlFor="b-year" className="label block">
            Año · opcional
          </label>
          <input id="b-year" name="year" inputMode="numeric" defaultValue={initial?.year ?? ""} maxLength={4} className="field" />
          {e.year && <p className="mt-2 text-sm text-danger">{e.year}</p>}
        </div>
        <div>
          <label htmlFor="b-isbn" className="label block">
            ISBN · opcional
          </label>
          <input id="b-isbn" name="isbn" defaultValue={initial?.isbn ?? ""} maxLength={20} className="field" />
          {e.isbn && <p className="mt-2 text-sm text-danger">{e.isbn}</p>}
        </div>
        <div>
          <label htmlFor="b-area" className="label block">
            Área
          </label>
          <select id="b-area" name="area" value={area} onChange={(ev) => setArea(ev.target.value)} className="field">
            <option value="">Sin área</option>
            {catalog.areas.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <TopicMultiSelect
        name="topics"
        label="Temas"
        areas={catalog.areas}
        topics={catalog.topics}
        initial={initial?.topics ?? []}
        max={6}
        preferArea={area || null}
        hint="Ayudan a que lo encuentre quien se interesa por esos temas."
        error={e.topics}
      />
      <div className="max-w-[12rem]">
        <CoverPicker currentUrl={initial?.cover_url} onFile={setCover} error={e.cover} aspect="aspect-[2/3]" />
        {mode === "edit" && initial?.cover_url && (
          <label className="mt-2 flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" name="remove_cover" /> Quitar la portada
          </label>
        )}
        <p className="mt-2 text-xs text-muted">Opcional. Si no subes ninguna, se genera una portada tipográfica.</p>
      </div>

      {mode === "new" && (
        <section className="space-y-6 border-t hairline pt-8">
          <h2 className="font-serif text-xl text-ink">Tu recomendación</h2>
          <RecommendationFields errors={e} body={state.values?.body} />
        </section>
      )}

      <div className="flex justify-end border-t hairline pt-6">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Guardando…" : mode === "new" ? "Recomendar libro" : "Guardar ficha"}
        </button>
      </div>
    </form>
  );
}
