import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { AVAILABILITY_LABELS } from "@/lib/content";
import type { MemberCard } from "@/lib/data/members";
import { ConnectButton } from "./connect-button";

/** Resultado del buscador de miembros: afinidad visible y acción de conexión. */
export function MemberResult({ m }: { m: MemberCard }) {
  const place = [m.region, m.country].filter(Boolean).join(", ");
  return (
    <li className="grid gap-4 border-b hairline py-6 sm:grid-cols-[1fr_auto] sm:items-start">
      <div className="flex gap-4">
        <Link href={`/miembros/${m.username}`} className="shrink-0">
          <Avatar url={m.avatar_url} name={m.display_name} size={56} />
        </Link>
        <div className="min-w-0">
          <Link href={`/miembros/${m.username}`} className="font-serif text-xl text-ink hover:text-accent">
            {m.display_name}
          </Link>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-muted">
            <span className="font-mono">@{m.username}</span>
            {place && <span>{place}</span>}
            <span className={m.availability === "open" ? "text-accent" : ""}>{AVAILABILITY_LABELS[m.availability]}</span>
          </p>
          {m.reasons.length > 0 && (
            <ul className="mt-2.5 space-y-1 text-sm text-accent-strong">
              {m.reasons.slice(0, 2).map((r) => (
                <li key={r} className="flex gap-2">
                  <span aria-hidden="true" className="text-accent">✦</span>
                  {r}
                </li>
              ))}
            </ul>
          )}
          {m.shared_topics.length > 0 ? (
            <p className="mt-2.5 flex flex-wrap gap-1.5">
              {m.shared_topics.slice(0, 5).map((i) => (
                <span key={i} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-accent-strong">
                  {i}
                </span>
              ))}
            </p>
          ) : (
            m.topics.length > 0 && <p className="mt-2 text-sm text-ink-2">{m.topics.slice(0, 4).join(" · ")}</p>
          )}
          {m.bio && <p className="mt-2.5 line-clamp-2 text-[0.9375rem] leading-relaxed text-ink-2">{m.bio}</p>}
        </div>
      </div>
      <div className="sm:pt-1">
        <ConnectButton otherId={m.id} otherName={m.display_name} initial={m.connection} size="sm" />
      </div>
    </li>
  );
}
