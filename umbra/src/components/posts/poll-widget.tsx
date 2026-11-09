"use client";

import { useState, useTransition } from "react";
import { closePollAction, votePollAction } from "@/app/(app)/actions/posts";
import type { PollState } from "@/lib/data/posts";
import { formatDate } from "@/lib/format";
import { IconPoll } from "@/components/ui/icons";

/**
 * Encuesta: votar, cambiar o retirar el voto y ver totales.
 * Los resultados se muestran tras votar o al cerrarse (nunca quién votó qué).
 */
export function PollWidget({ postId, poll, canVote, canClose }: { postId: string; poll: PollState; canVote: boolean; canClose: boolean }) {
  const voted = poll.options.some((o) => o.mine);
  const [choice, setChoice] = useState<number[]>(poll.options.filter((o) => o.mine).map((o) => o.id));
  const [editing, setEditing] = useState(!voted && !poll.closed);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const showResults = poll.closed || !editing || !canVote;
  const total = poll.options.reduce((n, o) => n + o.votes, 0);

  function toggle(id: number) {
    setChoice((c) => (poll.multiple ? (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]) : [id]));
  }

  function submit(ids: number[]) {
    setMessage(null);
    start(async () => {
      const r = await votePollAction(postId, ids);
      if (!r.ok) return setMessage(r.message ?? "No se pudo votar.");
      setEditing(ids.length === 0);
      if (ids.length === 0) setChoice([]);
    });
  }

  return (
    <section aria-labelledby={`poll-${postId}`} className="mt-9 rounded-sm border border-line-2 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`poll-${postId}`} className="label flex items-center gap-2">
          <IconPoll size={16} /> Encuesta · {poll.multiple ? "varias respuestas" : "una respuesta"}
        </h2>
        <p className="text-xs text-muted">
          {poll.closed ? "Cerrada" : poll.closesAt ? `Cierra el ${formatDate(poll.closesAt)}` : "Sin fecha de cierre"} ·{" "}
          {poll.voters} {poll.voters === 1 ? "persona ha votado" : "personas han votado"}
        </p>
      </div>

      {showResults ? (
        <ul className="mt-4 space-y-3">
          {poll.options.map((o) => {
            const pct = total ? Math.round((o.votes / total) * 100) : 0;
            return (
              <li key={o.id}>
                <div className="flex items-baseline justify-between gap-3 text-[0.9375rem]">
                  <span className={o.mine ? "font-medium text-ink" : "text-ink-2"}>
                    {o.label}
                    {o.mine && <span className="ml-2 text-xs text-accent">tu voto</span>}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {pct}% · {o.votes}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                  <div className={`h-full rounded-full ${o.mine ? "bg-accent" : "bg-accent-mid"}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <fieldset className="mt-4">
          <legend className="sr-only">Opciones</legend>
          <div className="space-y-2">
            {poll.options.map((o) => (
              <label
                key={o.id}
                className={`flex cursor-pointer items-center gap-3 rounded-sm border px-3.5 py-3 text-[0.9375rem] transition-colors ${
                  choice.includes(o.id) ? "border-accent-mid bg-accent-faint" : "border-line-2 hover:border-accent-mid"
                }`}
              >
                <input
                  type={poll.multiple ? "checkbox" : "radio"}
                  name={`poll-${postId}`}
                  checked={choice.includes(o.id)}
                  onChange={() => toggle(o.id)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {canVote && !poll.closed && editing && (
          <button type="button" className="btn btn-primary btn-sm" disabled={pending || !choice.length} onClick={() => submit(choice)}>
            {pending ? "Votando…" : voted ? "Cambiar voto" : "Votar"}
          </button>
        )}
        {canVote && !poll.closed && !editing && (
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
              Cambiar voto
            </button>
            <button type="button" className="btn btn-quiet btn-sm" disabled={pending} onClick={() => submit([])}>
              Retirar voto
            </button>
          </>
        )}
        {canClose && !poll.closed && (
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await closePollAction(postId);
                if (!r.ok) setMessage(r.message ?? "No se pudo cerrar.");
              })
            }
          >
            Cerrar encuesta
          </button>
        )}
        {message && (
          <span role="alert" className="text-sm text-danger">
            {message}
          </span>
        )}
      </div>
    </section>
  );
}
