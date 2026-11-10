import Link from "next/link";
import { coverUrl } from "@/lib/media";
import { PROJECT_STATUS, VISIBILITY } from "@/lib/content";
import { plural, timeAgo } from "@/lib/format";
import type { CircleRow } from "@/lib/data/circles";
import type { ProjectRow } from "@/lib/data/projects";
import { IconCircles, IconLock, IconProjects } from "@/components/ui/icons";

function Cover({ path, icon }: { path: string | null; icon: React.ReactNode }) {
  const url = coverUrl(path);
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-surface-2">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagen ya reducida al subir
        <img src={url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
      ) : (
        <div className="grid h-full w-full place-items-center text-accent-mid/70">{icon}</div>
      )}
    </div>
  );
}

export function CircleCard({ c, note }: { c: CircleRow; note?: string }) {
  return (
    <li>
      <Link href={`/circulos/${c.slug}`} className="group block">
        <Cover path={c.image_path} icon={<IconCircles size={44} />} />
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          {c.visibility !== "public" && <IconLock size={13} />}
          <span>{VISIBILITY[c.visibility].label}</span>
          <span>·</span>
          <span>{plural(c.member_count, "miembro", "miembros")}</span>
          {note && (
            <>
              <span>·</span>
              <span className="text-accent">{note}</span>
            </>
          )}
        </div>
        <h3 className="mt-1.5 font-serif text-xl leading-snug text-ink group-hover:text-accent">{c.name}</h3>
        {c.description && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-2">{c.description}</p>}
      </Link>
    </li>
  );
}

const STATUS_STYLE: Record<ProjectRow["status"], string> = {
  idea: "border-dashed border-ink/40 text-ink-2",
  planning: "border-line-2 text-ink-2",
  active: "border-accent-mid bg-accent-faint text-accent-strong",
  paused: "border-line-2 text-muted",
  completed: "border-transparent bg-surface-2 text-ink-2",
};

export function StatusBadge({ status }: { status: ProjectRow["status"] }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[0.6875rem] font-medium ${STATUS_STYLE[status]}`}>
      {PROJECT_STATUS[status]}
    </span>
  );
}

export function ProjectCard({ p }: { p: ProjectRow }) {
  const place = [p.region, p.country].filter(Boolean).join(", ");
  return (
    <li>
      <Link href={`/proyectos/${p.slug}`} className="group block">
        <Cover path={p.cover_path} icon={<IconProjects size={44} />} />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          <StatusBadge status={p.status} />
          {place && <span>{place}</span>}
          <span>· {plural(p.participant_count, "participante", "participantes")}</span>
        </div>
        <h3 className="mt-2 font-serif text-xl leading-snug text-ink group-hover:text-accent">{p.title}</h3>
        {p.summary && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-2">{p.summary}</p>}
        <p className="mt-2 text-xs text-muted">Actividad {timeAgo(p.last_activity_at)}</p>
      </Link>
    </li>
  );
}
