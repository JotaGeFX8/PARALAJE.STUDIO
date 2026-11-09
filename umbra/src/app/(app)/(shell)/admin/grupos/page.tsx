import Link from "next/link";
import { allCircles, allProjects } from "@/lib/data/admin";
import { ModButton } from "@/components/admin/controls";
import { modDeleteCircleAction, modDeleteProjectAction } from "@/app/(app)/actions/admin";
import { PROJECT_STATUS, VISIBILITY } from "@/lib/content";
import { timeAgo } from "@/lib/format";

export default async function GruposAdminPage() {
  const [circles, projects] = await Promise.all([allCircles(), allProjects()]);
  return (
    <div className="grid gap-14 xl:grid-cols-2">
      <section>
        <h2 className="label mb-3">Círculos ({circles.length})</h2>
        <ul className="border-t hairline">
          {circles.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 border-b hairline py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/circulos/${c.slug}`} className="font-serif text-lg text-ink hover:text-accent">
                  {c.name}
                </Link>
                <p className="text-xs text-muted">
                  {VISIBILITY[c.visibility].label} · {c.member_count} miembros · {c.owner?.display_name ?? c.owner?.username} · {timeAgo(c.created_at)}
                </p>
              </div>
              <ModButton label="Eliminar" confirmLabel="Eliminar círculo" askReason danger action={modDeleteCircleAction.bind(null, c.id)} />
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="label mb-3">Proyectos ({projects.length})</h2>
        <ul className="border-t hairline">
          {projects.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 border-b hairline py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/proyectos/${p.slug}`} className="font-serif text-lg text-ink hover:text-accent">
                  {p.title}
                </Link>
                <p className="text-xs text-muted">
                  {PROJECT_STATUS[p.status]} · {p.participant_count} participantes · {p.owner?.display_name ?? p.owner?.username} ·{" "}
                  {timeAgo(p.created_at)}
                </p>
              </div>
              <ModButton label="Eliminar" confirmLabel="Eliminar proyecto" askReason danger action={modDeleteProjectAction.bind(null, p.id)} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
