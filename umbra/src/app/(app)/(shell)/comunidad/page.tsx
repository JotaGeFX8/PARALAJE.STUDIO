import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { getCategories, getCategoryStats, getTrendingTags } from "@/lib/data/posts";
import { PageHeader } from "@/components/ui/page-header";
import { IconPlus } from "@/components/ui/icons";
import { AREAS } from "@/lib/content";
import { plural, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Comunidad" };

export default async function ComunidadPage() {
  await requireOnboardedMember();
  const [categories, stats, tags] = await Promise.all([getCategories(), getCategoryStats(), getTrendingTags(16)]);

  return (
    <>
      <PageHeader eyebrow="Comunidad · Foros" title="Territorios" lead={AREAS[1].description}>
        <Link href="/publicar" className="btn btn-primary">
          <IconPlus size={18} /> Publicar
        </Link>
      </PageHeader>

      <div className="grid gap-14 xl:grid-cols-[1fr_18rem]">
        <ol className="border-t hairline">
          {categories.map((c, i) => {
            const s = stats.get(c.slug);
            return (
              <li key={c.slug}>
                <Link
                  href={`/comunidad/${c.slug}`}
                  className="group grid grid-cols-[2.25rem_1fr] gap-x-3 border-b hairline py-6 transition-colors md:grid-cols-[3rem_1fr_11rem] md:items-center md:gap-6"
                >
                  <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block font-serif text-xl text-ink transition-colors group-hover:text-accent md:text-2xl">
                      {c.name}
                    </span>
                    <span className="mt-1 block text-[0.9375rem] leading-relaxed text-muted">{c.description}</span>
                  </span>
                  <span className="col-start-2 mt-3 text-[0.8125rem] text-muted md:col-start-auto md:mt-0 md:text-right">
                    <span className="block text-ink-2">{plural(s?.count ?? 0, "publicación", "publicaciones")}</span>
                    {s?.last && <span className="block">actividad {timeAgo(s.last)}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        <aside className="space-y-10">
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
              Indica si tu aportación es documentada, una hipótesis, una opinión o una experiencia. Lo documentado
              necesita fuentes.
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
