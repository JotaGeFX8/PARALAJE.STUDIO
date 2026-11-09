import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getFeed, getTag } from "@/lib/data/posts";
import { PageHeader } from "@/components/ui/page-header";
import { PostList } from "@/components/posts/post-row";
import { NavTabs, Pagination, hrefWith } from "@/components/ui/nav-tabs";
import { SORTS, parseSort } from "@/lib/content";
import { oneParam, pageParam } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `#${(await params).slug}` };
}

export default async function EtiquetaPage({ params, searchParams }: Props) {
  await requireOnboardedMember();
  const { slug } = await params;
  const sp = await searchParams;
  const tag = await getTag(slug);
  if (!tag || tag.status === "blocked") notFound();
  if (tag.merged_into) redirect(`/etiqueta/${tag.merged_into}`);
  const sort = parseSort(oneParam(sp.orden));
  const page = pageParam(sp.pagina);
  const base = `/etiqueta/${slug}`;
  const current = { orden: sort === "recent" ? undefined : sort };
  const { items, hasMore } = await getFeed({ scope: "all", tag: slug, sort, page });
  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Etiqueta" title={`#${tag.slug}`} />
      <NavTabs
        label="Ordenar"
        active={sort}
        items={SORTS.map((s) => ({ key: s.key, label: s.label, short: s.short, href: hrefWith(base, {}, { orden: s.key === "recent" ? undefined : s.key }) }))}
      />
      <div className="mt-6">
        <PostList items={items} empty="No hay publicaciones con esta etiqueta." />
        <Pagination page={page} hasMore={hasMore} hrefFor={(n) => hrefWith(base, current, { pagina: n > 1 ? String(n) : undefined })} />
      </div>
    </div>
  );
}
