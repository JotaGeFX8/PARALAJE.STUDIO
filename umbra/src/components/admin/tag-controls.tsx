"use client";

import { useState, useTransition } from "react";
import { mergeTagAction, updateTagAction } from "@/app/(app)/actions/admin";

type Tag = { slug: string; name: string; status: string; merged_into: string | null; topic_id: number | null; topic_name: string | null; uses: number };

/** Fila de moderación de una etiqueta: renombrar, bloquear o fusionar en otra. */
export function TagRow({ tag }: { tag: Tag }) {
  const [name, setName] = useState(tag.name);
  const [into, setInto] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; message?: string } | null>(null);
  const [pending, start] = useTransition();
  const blocked = tag.status === "blocked";
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, ok: string) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, message: ok } : r);
    });

  return (
    <li className="grid gap-3 border-b hairline py-4 lg:grid-cols-[12rem_1fr_auto] lg:items-center">
      <div>
        <p className={`font-mono text-sm ${blocked ? "text-muted line-through" : "text-ink"}`}>#{tag.slug}</p>
        <p className="text-xs text-muted">
          {tag.uses} {tag.uses === 1 ? "uso" : "usos"}
          {tag.topic_name && <> · tema «{tag.topic_name}»</>}
          {tag.merged_into && <> · fusionada en #{tag.merged_into}</>}
          {blocked && " · bloqueada"}
        </p>
      </div>
      {tag.merged_into ? (
        <span className="text-sm text-muted">Las publicaciones nuevas usan #{tag.merged_into}.</span>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`n-${tag.slug}`}>
            Nombre visible de #{tag.slug}
          </label>
          <input id={`n-${tag.slug}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={32} className="field !w-40 !py-1 !text-sm" />
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending || name.trim().length < 2} onClick={() => run(() => updateTagAction(tag.slug, name, tag.status as "active" | "blocked", tag.topic_id), "Guardada.")}>
            Renombrar
          </button>
          <label className="sr-only" htmlFor={`m-${tag.slug}`}>
            Fusionar #{tag.slug} en
          </label>
          <input id={`m-${tag.slug}`} value={into} onChange={(e) => setInto(e.target.value)} placeholder="fusionar en…" maxLength={33} className="field !w-36 !py-1 !text-sm" />
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending || !into.trim()} onClick={() => run(() => mergeTagAction(tag.slug, into), "Fusionada.")}>
            Fusionar
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        {!tag.merged_into && (
          <button
            type="button"
            className={`btn btn-sm ${blocked ? "btn-ghost" : "btn-danger"}`}
            disabled={pending}
            onClick={() => run(() => updateTagAction(tag.slug, name, blocked ? "active" : "blocked", tag.topic_id), blocked ? "Desbloqueada." : "Bloqueada y retirada de las publicaciones.")}
          >
            {blocked ? "Desbloquear" : "Bloquear"}
          </button>
        )}
        {msg && <span className={`text-xs ${msg.ok ? "text-accent" : "text-danger"}`}>{msg.message}</span>}
      </div>
    </li>
  );
}
