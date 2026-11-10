"use client";

import { useState, useTransition } from "react";
import { setReactionAction } from "@/app/(app)/actions/posts";
import { REACTIONS } from "@/lib/content";
import type { ReactionType } from "@/lib/supabase/types";
import { IconCheck, IconEye, IconHeart, IconQuote, IconSpark } from "@/components/ui/icons";

export type ReactionCounts = Record<ReactionType, { total: number; mine: boolean }>;

const ICONS = { like: IconHeart, valuable: IconSpark, curious: IconEye, agree: IconCheck, needs_sources: IconQuote } as const;

/** Reacciones con actualización inmediata (se revierte si el servidor falla). */
export function ReactionBar({
  target,
  id,
  initial,
  compact = false,
  disabled = false,
}: {
  target: "post" | "comment";
  id: string;
  initial: ReactionCounts;
  compact?: boolean;
  disabled?: boolean;
}) {
  const [state, setState] = useState(initial);
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(type: ReactionType) {
    const prev = state;
    const on = !prev[type].mine;
    const next = { ...prev, [type]: { total: prev[type].total + (on ? 1 : -1), mine: on } };
    setState(next);
    setError(null);
    start(async () => {
      const res = await setReactionAction(target, id, type, on);
      if (!res.ok) {
        setState(prev);
        setError(res.message ?? "No se pudo guardar.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Reacciones">
      {REACTIONS.map((r) => {
        const Icon = ICONS[r.key];
        const s = state[r.key];
        return (
          <button
            key={r.key}
            type="button"
            disabled={disabled}
            onClick={() => toggle(r.key)}
            aria-pressed={s.mine}
            title={r.hint}
            className={`icon-btn ${s.mine ? (r.key === "like" ? "!text-like" : "bg-accent-soft !text-accent-strong") : ""}`}
          >
            {r.key === "like" ? <IconHeart size={compact ? 15 : 17} filled={s.mine} /> : <Icon size={compact ? 15 : 17} />}
            {!compact && <span>{r.label}</span>}
            <span className="font-mono text-xs tabular-nums">{s.total > 0 ? s.total : compact ? "" : 0}</span>
            {compact && <span className="sr-only">{r.label}</span>}
          </button>
        );
      })}
      {error && (
        <span role="alert" className="ml-2 text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
