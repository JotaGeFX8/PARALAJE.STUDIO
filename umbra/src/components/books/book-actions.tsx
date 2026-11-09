"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteRecommendationAction, saveRecommendationAction, setHelpfulAction, setShelfAction } from "@/app/(app)/actions/books";
import { initialFormState } from "@/lib/form-state";
import { BOOK_LEVELS, SHELVES, type BookLevelKey, type ShelfKey } from "@/lib/content";
import { FormMessage, SubmitButton } from "@/components/forms/fields";

/** Estantería personal: quiero leerlo · leyendo · leído (privada; solo se muestran totales). */
export function ShelfButtons({ bookId, initial }: { bookId: string; initial: ShelfKey | null }) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <div role="group" aria-label="Tu estantería" className="flex flex-wrap gap-1.5">
        {SHELVES.map((s) => (
          <button
            key={s.key}
            type="button"
            className="chip !min-h-9"
            aria-pressed={value === s.key}
            disabled={pending}
            onClick={() => {
              const next = value === s.key ? null : s.key;
              setValue(next);
              setError(null);
              start(async () => {
                const r = await setShelfAction(bookId, next);
                if (!r.ok) {
                  setValue(value);
                  setError(r.message ?? "No se pudo guardar.");
                }
              });
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Tu estantería es privada.</p>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function HelpfulButton({ recId, initial, count, disabled }: { recId: string; initial: boolean; count: number; disabled?: boolean }) {
  const [on, setOn] = useState(initial);
  const [n, setN] = useState(count);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="chip !min-h-8 !px-3 !text-[0.8125rem]"
      aria-pressed={on}
      disabled={pending || disabled}
      title={disabled ? "No puedes valorar tu propia recomendación" : undefined}
      onClick={() => {
        const next = !on;
        setOn(next);
        setN((x) => x + (next ? 1 : -1));
        start(async () => {
          const r = await setHelpfulAction(recId, next);
          if (!r.ok) {
            setOn(!next);
            setN((x) => x + (next ? -1 : 1));
          }
        });
      }}
    >
      Me ha sido útil · {n}
    </button>
  );
}

/** Recomendación propia: por qué, nivel y valoración. */
export function RecommendationForm({
  bookId,
  initial,
}: {
  bookId: string;
  initial?: { id: string; body: string; level: BookLevelKey; rating: number | null } | null;
}) {
  const [state, action] = useActionState(saveRecommendationAction, initialFormState);
  const [deleting, startDelete] = useTransition();
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-6" id="recomendar">
      <input type="hidden" name="book_id" value={bookId} />
      <FormMessage message={state.ok ? undefined : state.message} />
      {state.ok && <FormMessage tone="ok" message={state.message} />}
      <RecommendationFields initial={initial} errors={e} body={state.values?.body} />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton className="btn btn-primary" pendingLabel="Guardando…">
          {initial ? "Guardar cambios" : "Publicar recomendación"}
        </SubmitButton>
        {initial && (
          <button
            type="button"
            className="btn btn-quiet"
            disabled={deleting}
            onClick={() => startDelete(async () => void (await deleteRecommendationAction(initial.id)))}
          >
            {deleting ? "Borrando…" : "Retirar mi recomendación"}
          </button>
        )}
      </div>
    </form>
  );
}

/** Campos comunes de una recomendación (también en el formulario de libro nuevo). */
export function RecommendationFields({
  initial,
  errors,
  body,
}: {
  initial?: { body: string; level: BookLevelKey; rating: number | null } | null;
  errors: Record<string, string>;
  body?: string;
}) {
  return (
    <>
      <div>
        <label htmlFor="rec-body" className="label block">
          ¿Por qué lo recomiendas?
        </label>
        <textarea
          id="rec-body"
          name="body"
          defaultValue={body ?? initial?.body ?? ""}
          maxLength={3000}
          rows={5}
          className="field"
          placeholder="Qué aprendiste, a quién se lo recomendarías, qué capítulos son imprescindibles…"
        />
        {errors.body && <p className="mt-2 text-sm text-danger">{errors.body}</p>}
      </div>
      <fieldset>
        <legend className="label mb-3">Nivel de lectura</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {BOOK_LEVELS.map((l) => (
            <label key={l.key} className="flex cursor-pointer gap-3 rounded-sm border border-line-2 p-3 has-[:checked]:border-accent-mid has-[:checked]:bg-accent-faint">
              <input type="radio" name="level" value={l.key} defaultChecked={(initial?.level ?? "intro") === l.key} className="mt-1" />
              <span>
                <span className="block text-[0.9375rem] font-medium text-ink">{l.label}</span>
                <span className="block text-[0.8125rem] leading-snug text-muted">{l.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label mb-3">Tu valoración</legend>
        <div className="flex flex-wrap gap-1.5">
          {[5, 4, 3, 2, 1].map((n) => (
            <label key={n} className="chip cursor-pointer" title={`${n} de 5`}>
              <input type="radio" name="rating" value={n} defaultChecked={initial?.rating === n} className="sr-only" />
              <span aria-hidden="true" className="text-accent">
                {"★".repeat(n)}
              </span>
              <span className="sr-only">{n} de 5</span>
            </label>
          ))}
          <label className="chip cursor-pointer">
            <input type="radio" name="rating" value="" defaultChecked={!initial?.rating} className="sr-only" />
            Sin valorar
          </label>
        </div>
        {errors.rating && <p className="mt-2 text-sm text-danger">{errors.rating}</p>}
      </fieldset>
    </>
  );
}
