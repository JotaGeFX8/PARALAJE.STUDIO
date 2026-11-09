import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getCategory, getFeed } from "@/lib/data/posts";
import { PageHeader } from "@/components/ui/page-header";
import { PostList } from "@/components/posts/post-row";
import { NavTabs, Pagination, hrefWith } from "@/components/ui/nav-tabs";
import { IconPlus } from "@/components/ui/icons";
import { EPISTEMIC_KINDS, SORTS, parseSort, type PostKind } from "@/lib/content";
import { oneParam, pageParam } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCategory(slug);
  return { title: c?.name ?? "Territorio" };
}

export default async function TerritorioPage({ params, searchParams }: Props) {
  await requireOnboardedMember();
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  const sort = parseSort(oneParam(sp.orden));
  const kindParam = oneParam(sp.tipo);
  const kind = EPISTEMIC_KINDS.some((k) => k.key === kindParam) ? (kindParam as PostKind) : null;
  const tag = oneParam(sp.etiqueta) || null;
  const page = pageParam(sp.pagina);
  const current = { orden: sort === "recent" ? undefined : sort, tipo: kind ?? undefined, etiqueta: tag ?? undefined };
  const base = `/comunidad/${slug}`;

  const { items, hasMore } = await getFeed({ scope: "forum", category: slug, sort, kind, tag, page });

  return (
    <>
      <p className="mb-6 text-sm">
        <Link href="/comunidad" className="link-draw text-muted hover:text-accent">
          ← Territorios
        </Link>
      </p>
      <PageHeader eyebrow="Territorio" title={category.name} lead={category.description}>
        <Link href={`/publicar?territorio=${slug}`} className="btn btn-primary">
          <IconPlus size={18} /> Publicar aquí
        </Link>
      </PageHeader>

      <NavTabs
        label="Ordenar"
        active={sort}
        items={SORTS.map((s) => ({
          key: s.key,
          label: s.label,
          short: s.short,
          href: hrefWith(base, current, { orden: s.key === "recent" ? undefined : s.key }),
        }))}
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={hrefWith(base, current, { tipo: undefined })} className="chip !min-h-8" aria-current={!kind ? "page" : undefined}>
          Todo
        </Link>
        {EPISTEMIC_KINDS.map((k) => (
          <Link
            key={k.key}
            href={hrefWith(base, current, { tipo: k.key })}
            className="chip !min-h-8"
            aria-current={kind === k.key ? "page" : undefined}
          >
            {k.name}
          </Link>
        ))}
        {tag && (
          <Link href={hrefWith(base, current, { etiqueta: undefined })} className="chip !min-h-8" aria-current="page">
            #{tag} ✕
          </Link>
        )}
      </div>

      <div className="mt-6">
        <PostList
          items={items}
          showCategory={false}
          empty={
            <>
              Todavía no hay publicaciones {kind || tag ? "con estos filtros" : "en este territorio"}.{" "}
              <Link href={`/publicar?territorio=${slug}`} className="link">
                Abre la primera conversación
              </Link>
              .
            </>
          }
        />
        <Pagination page={page} hasMore={hasMore} hrefFor={(n) => hrefWith(base, current, { pagina: n > 1 ? String(n) : undefined })} />
      </div>
    </>
  );
}
