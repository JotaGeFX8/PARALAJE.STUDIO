import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { listProjects } from "@/lib/data/projects";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { NavTabs, hrefWith } from "@/components/ui/nav-tabs";
import { EmptyState } from "@/components/ui/section";
import { ProjectCard } from "@/components/groups/cards";
import { IconPlus } from "@/components/ui/icons";
import { AREAS, PROJECT_STATUS } from "@/lib/content";
import { oneParam } from "@/lib/format";
import type { Enums } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Proyectos" };

const SORTS = [
  { key: "active", label: "Con actividad" },
  { key: "recent", label: "Nuevos" },
  { key: "people", label: "Más participantes" },
] as const;

export default async function ProyectosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { profile } = await requireOnboardedMember();
  const sp = await searchParams;
  const statusRaw = oneParam(sp.estado);
  const status = (statusRaw in PROJECT_STATUS ? statusRaw : null) as Enums<"project_status"> | null;
  const interest = oneParam(sp.tema) || null;
  const q = oneParam(sp.q).slice(0, 80);
  const mine = oneParam(sp.mios) === "1";
  const sortRaw = oneParam(sp.orden);
  const sort = (SORTS.some((s) => s.key === sortRaw) ? sortRaw : "active") as (typeof SORTS)[number]["key"];
  const current = { estado: status ?? undefined, tema: interest ?? undefined, q: q || undefined, mios: mine ? "1" : undefined, orden: sort === "active" ? undefined : sort };

  const supabase = await createClient();
  const [projects, { data: interests }] = await Promise.all([
    listProjects({ status, interest, q, mine: mine ? profile.id : null }, sort),
    supabase.from("interests").select("slug, name").order("position"),
  ]);

  return (
    <>
      <PageHeader eyebrow="Iniciativas" title="Proyectos" lead={AREAS[4].description}>
        <Link href="/proyectos/nuevo" className="btn btn-primary">
          <IconPlus size={18} /> Publicar proyecto
        </Link>
      </PageHeader>

      <NavTabs
        label="Ordenar proyectos"
        active={sort}
        items={SORTS.map((s) => ({ key: s.key, label: s.label, href: hrefWith("/proyectos", current, { orden: s.key === "active" ? undefined : s.key }) }))}
      />
      <form action="/proyectos" className="mt-5 grid gap-4 sm:grid-cols-[1fr_12rem_14rem_auto] sm:items-end">
        <div>
          <label htmlFor="pq" className="label block">
            Buscar
          </label>
          <input id="pq" name="q" defaultValue={q} placeholder="huerto, adobe, archivo histórico, región…" className="field" />
        </div>
        <div>
          <label htmlFor="pe" className="label block">
            Estado
          </label>
          <select id="pe" name="estado" defaultValue={status ?? ""} className="field">
            <option value="">Todos</option>
            {(Object.keys(PROJECT_STATUS) as (keyof typeof PROJECT_STATUS)[]).map((k) => (
              <option key={k} value={k}>
                {PROJECT_STATUS[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pt" className="label block">
            Temática
          </label>
          <select id="pt" name="tema" defaultValue={interest ?? ""} className="field">
            <option value="">Todas</option>
            {(interests ?? []).map((i) => (
              <option key={i.slug} value={i.slug}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" name="mios" value="1" defaultChecked={mine} /> Los míos
          </label>
          <button type="submit" className="btn btn-ghost btn-sm">
            Filtrar
          </button>
        </div>
      </form>

      <div className="mt-10">
        {projects.length ? (
          <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </ul>
        ) : (
          <EmptyState action={<Link href="/proyectos/nuevo" className="btn btn-primary">Publicar un proyecto</Link>}>
            {q || status || interest || mine
              ? "Ningún proyecto coincide con estos filtros."
              : "Todavía no hay proyectos. Convierte una conversación en una iniciativa real."}
          </EmptyState>
        )}
      </div>
    </>
  );
}
