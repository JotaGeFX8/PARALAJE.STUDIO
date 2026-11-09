"use client";

import { useState, useTransition } from "react";
import { unblockMemberAction } from "@/app/(app)/actions/social";
import { Avatar } from "@/components/ui/avatar";

type Row = { blocked_id: string; blocked: { username: string | null; display_name: string | null; avatar_url: string | null } | null };

export function BlockedList({ rows }: { rows: Row[] }) {
  const [list, setList] = useState(rows);
  const [pending, start] = useTransition();
  if (!list.length) return <p className="text-[0.9375rem] text-muted">No has bloqueado a nadie.</p>;
  return (
    <ul className="space-y-3">
      {list.map((r) => {
        const name = r.blocked?.display_name ?? r.blocked?.username ?? "Miembro";
        return (
          <li key={r.blocked_id} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-3">
              <Avatar url={r.blocked?.avatar_url} name={name} size={32} />
              <span className="text-[0.9375rem] text-ink">{name}</span>
            </span>
            <button
              type="button"
              disabled={pending}
              className="btn btn-quiet btn-sm"
              onClick={() =>
                start(async () => {
                  const res = await unblockMemberAction(r.blocked_id);
                  if (res.ok) setList((l) => l.filter((x) => x.blocked_id !== r.blocked_id));
                })
              }
            >
              Desbloquear
            </button>
          </li>
        );
      })}
    </ul>
  );
}
