import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { myDrafts } from "@/lib/data/feed";
import { signImages } from "@/lib/data/posts";
import { PageHeader } from "@/components/ui/page-header";
import { DraftActions } from "@/components/feed/draft-actions";
import { IconBook, IconCircles, IconCommunity, IconImage, IconPoll, IconProjects, IconSearch } from "@/components/ui/icons";
import { oneParam } from "@/lib/format";

export const metadata: Metadata = { title: "Crear" };

const OPTIONS = [
  { href: "/crear/foto", icon: IconImage, title: "Fotos", text: "Una o varias fotos con su pie, para tu perfil y el feed." },
  { href: "/publicar", icon: IconCommunity, title: "Publicación", text: "Debate, pregunta, investigación, recurso o idea, en un foro." },
  { href: "/publicar?tipo=exploration", icon: IconSearch, title: "Exploración", text: "Una pregunta o descubrimiento que otras personas amplían con aportaciones y fuentes." },
  { href: "/publicar?tipo=poll", icon: IconPoll, title: "Encuesta", text: "Pregunta con opciones; votos anónimos." },
  { href: "/libros/recomendar", icon: IconBook, title: "Recomendar un libro", text: "Con el porqué, el nivel y tu valoración." },
  { href: "/proyectos/nuevo", icon: IconProjects, title: "Proyecto", text: "Una iniciativa real que busca colaboradores." },
  { href: "/circulos/nuevo", icon: IconCircles, title: "Círculo", text: "Una comunidad propia, pública o privada." },
] as const;

export default async function CrearPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { profile } = await requireOnboardedMember();
  const saved = oneParam((await searchParams).borrador) === "1";
  const drafts = await myDrafts(profile.id);
  const covers = await signImages(drafts.flatMap((d) => (d.image_paths[0] ? [d.image_paths[0]] : [])));
  const cover = new Map(covers.map((c) => [c.path, c.url]));
  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Crear" title="¿Qué quieres compartir?" />
      {saved && (
        <p role="status" className="mb-8 rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-strong">
          Borrador guardado. Solo tú puedes verlo; publícalo cuando quieras.
        </p>
      )}
      {profile.role === "restricted" ? (
        <p className="text-muted">Tu cuenta no puede publicar por ahora.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {OPTIONS.map((o) => (
            <li key={o.href}>
              <Link href={o.href} className="card group flex h-full items-start gap-4 p-5 transition-colors hover:border-accent-mid">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <o.icon size={22} />
                </span>
                <span>
                  <span className="block font-semibold text-ink group-hover:text-accent">{o.title}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-muted">{o.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <section className="mt-14">
        <h2 className="label mb-4">Tus borradores</h2>
        {drafts.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {drafts.map((d) => {
              const img = d.image_paths[0] ? cover.get(d.image_paths[0]) : null;
              return (
                <li key={d.id} className="flex flex-wrap items-center gap-4 py-4">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal
                    <img src={img} alt="" className="h-16 w-14 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="grid h-16 w-14 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
                      <IconCommunity size={18} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <Link href={`/p/${d.id}`} className="line-clamp-1 font-medium text-ink hover:text-accent">
                      {d.title || d.body || `${d.image_paths.length} ${d.image_paths.length === 1 ? "foto" : "fotos"}`}
                    </Link>
                    <span className="text-xs text-muted">Borrador · solo lo ves tú</span>
                  </span>
                  <DraftActions id={d.id} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">No tienes borradores. Al publicar fotos puedes elegir «Guardar borrador».</p>
        )}
      </section>
    </div>
  );
}
