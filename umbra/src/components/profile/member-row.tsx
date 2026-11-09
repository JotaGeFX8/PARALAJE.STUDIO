import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { AVAILABILITY_LABELS } from "@/lib/content";
import type { MemberCard } from "@/lib/data/members";

export function MemberRow({ m }: { m: MemberCard }) {
  const name = m.display_name ?? m.username ?? "";
  const place = [m.region, m.country].filter(Boolean).join(", ");
  return (
    <li>
      <Link
        href={`/miembros/${m.username}`}
        className="group grid grid-cols-[auto_1fr] gap-4 border-b hairline py-5 transition-colors"
      >
        <Avatar url={m.avatar_url} name={name} size={48} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-serif text-lg text-ink transition-colors group-hover:text-ink">{name}</span>
            <span className="font-mono text-xs text-muted">@{m.username}</span>
            {m.availability === "open" && (
              <span className="label !text-[0.625rem] text-accent">{AVAILABILITY_LABELS.open}</span>
            )}
          </div>
          {(place || m.shared) && (
            <p className="mt-1 text-sm text-muted">
              {[place, m.shared ? `${m.shared} ${m.shared === 1 ? "interés" : "intereses"} en común` : ""]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {m.interests.length > 0 && (
            <p className="mt-2 truncate text-sm text-ink-2">
              {m.interests.slice(0, 4).map((i, idx) => (
                <span key={i.slug}>
                  {idx > 0 && <span className="px-1.5 text-muted/60">/</span>}
                  <span className={i.is_favorite ? "text-ink" : ""}>{i.name}</span>
                </span>
              ))}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}
