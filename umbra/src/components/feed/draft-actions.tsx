"use client";

import { useState, useTransition } from "react";
import { publishDraftAction } from "@/app/(app)/actions/social-feed";
import { deletePostAction } from "@/app/(app)/actions/posts";

export function DraftActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={() => start(async () => setMsg((await publishDraftAction(id)).message ?? null))}>
        Publicar
      </button>
      <button type="button" className="btn btn-quiet btn-sm" disabled={pending} onClick={() => start(async () => void (await deletePostAction(id)))}>
        Descartar
      </button>
      {msg && <span className="text-xs text-danger">{msg}</span>}
    </span>
  );
}
