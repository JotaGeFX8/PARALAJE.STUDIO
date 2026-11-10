import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { MemberCard } from "@/lib/data/members";
import { FollowButton } from "./follow-button";

/** Personas sugeridas para seguir, con el motivo. */
export function SuggestedPeople({ people, title = "Sugerencias para ti" }: { people: MemberCard[]; title?: string }) {
  if (!people.length) return null;
  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <Link href="/conexiones" className="text-xs font-medium text-accent hover:text-accent-strong">
          Ver todo
        </Link>
      </div>
      <ul className="space-y-3">
        {people.map((m) => (
          <li key={m.id} className="flex items-center gap-3">
            <Link href={`/miembros/${m.username}`} className="shrink-0">
              <Avatar url={m.avatar_url} name={m.display_name} size={40} />
            </Link>
            <span className="min-w-0 flex-1 leading-tight">
              <Link href={`/miembros/${m.username}`} className="block truncate text-sm font-semibold text-ink hover:text-accent">
                {m.display_name}
              </Link>
              <span className="block truncate text-xs text-muted">{m.reasons[0] ?? (m.topics.slice(0, 2).join(" · ") || `@${m.username}`)}</span>
            </span>
            <FollowButton profileId={m.id} initial={false} size="sm" />
          </li>
        ))}
      </ul>
    </section>
  );
}
