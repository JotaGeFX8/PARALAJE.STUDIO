import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "./follow-button";

type Row = { id: string; username: string; display_name: string; avatar_url: string | null; i_follow: boolean };

export function FollowList({ title, back, rows, viewerId, hidden }: { title: string; back: string; rows: Row[]; viewerId: string; hidden: boolean }) {
  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-4 text-sm">
        <Link href={back} className="text-muted hover:text-accent">
          ← Volver al perfil
        </Link>
      </p>
      <h1 className="mb-6 text-2xl font-semibold text-ink">{title}</h1>
      {hidden ? (
        <p className="text-muted">Esta persona no muestra su red.</p>
      ) : rows.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <Link href={`/miembros/${r.username}`} className="shrink-0">
                <Avatar url={r.avatar_url} name={r.display_name} size={44} />
              </Link>
              <span className="min-w-0 flex-1 leading-tight">
                <Link href={`/miembros/${r.username}`} className="block truncate font-semibold text-ink hover:text-accent">
                  {r.display_name}
                </Link>
                <span className="block truncate text-sm text-muted">@{r.username}</span>
              </span>
              {r.id !== viewerId && <FollowButton profileId={r.id} initial={r.i_follow} size="sm" />}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">Nadie todavía.</p>
      )}
    </div>
  );
}
