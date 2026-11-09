import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { getForums, getForumStats, getTrendingTags } from "@/lib/data/posts";
import { PageHeader } from "@/components/ui/page-header";
import { IconPlus } from "@/components/ui/icons";
import { AREAS } from "@/lib/content";
import { plural, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Comunidad" };

export default async function ComunidadPage() {
  await requireOnboardedMember();
  const [forums, stats, tags] = await Promise.all([getForums(), getForumStats(), getTrendingTags(16)]);

  return (
    <>
      <PageHeader eyebrow="Comunidad" title="Los siete foros" lead={AREAS[1].description}>
        <Link href="/publicar" className="btn btn-primary">
          <IconPlus size={18} /> Publicar
        </Link>
      </PageHeader>

      <div className="grid gap-14 xl:grid-cols-[1fr_18rem]">
        <ol className="border-t hairline">
          {forums.map((f, i) => {
            const s = stats.byForum.get(f.slug);
            return (
              <li key={f.slug} className="border-b hairline py-7">
                <div className="grid grid-cols-[2.25rem_1fr] gap-x-3 md:grid-cols-[3rem_1fr_11rem] md:items-start md:gap-6">
                  <span className="pt-1.5 font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <Link href={`/comunidad/${f.slug}`} className="group block">
                      <span className="block font-serif text-2xl text-ink transition-colors group-hover:text-accent md:text-[1.75rem]">
                        {f.name}
                      </span>
                      <span className="mt-1 block text-[0.9375rem] leading-relaxed text-muted">{f.description}</span>
                    </Link>
                    {f.categories.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {f.categories.map((c) => {
                          const cs = stats.byCategory.get(c.slug);
                          return (
                            <li key={c.slug}>
                              <Link href={`/comunidad/${f.slug}/${c.slug}`} className="tag">
                                {c.name}
                                {cs?.count ? <span className="ml-1 text-muted">{cs.count}</span> : null}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <span className="col-start-2 mt-3 text-[0.8125rem] text-muted md:col-start-auto md:mt-1 md:text-right">
                    <span className="block text-ink-2">{plural(s?.count ?? 0, "publicación", "publicaciones")}</span>
                    {s?.unanswered ? <span className="block">{s.unanswered} sin responder</span> : null}
                    {s?.last && <span className="block">actividad {timeAgo(s.last)}</span>}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        <aside className="space-y-10">
          <Link href="/libros" className="group block rounded-sm border border-line-2 p-5 transition-colors hover:border-accent-mid">
            <p className="label">Biblioteca</p>
            <p className="mt-2 font-serif text-xl text-ink group-hover:text-accent">Libros recomendados por la comunidad</p>
            <p className="mt-1 text-sm text-muted">Con el porqué, el nivel de lectura y tu estantería personal.</p>
          </Link>
          <div>
            <p className="label mb-4">Etiquetas del mes</p>
            {tags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Link key={t.slug} href={`/etiqueta/${t.slug}`} className="tag">
                    #{t.slug} <span className="ml-1 text-muted">{Number(t.uses)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Aún no hay etiquetas este mes.</p>
            )}
          </div>
          <div className="rounded-sm bg-surface-2 p-5 text-sm leading-relaxed text-ink-2">
            <p className="font-medium text-ink">Antes de publicar</p>
            <p className="mt-2">
              Elige el tipo (debate, pregunta, investigación, recurso, encuesta…) y clasifica tu aportación: hecho
              documentado, hipótesis, interpretación, opinión o pregunta abierta. Lo documentado necesita fuentes.
            </p>
            <Link href="/normas" className="link mt-3 inline-block">
              Normas de la comunidad
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
