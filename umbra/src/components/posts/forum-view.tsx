import Link from "next/link";
import { getFeed, getForumStats, type Forum, type Subcategory } from "@/lib/data/posts";
import { PageHeader } from "@/components/ui/page-header";
import { PostList } from "@/components/posts/post-row";
import { QuickPost } from "@/components/posts/quick-post";
import { NavTabs, Pagination, hrefWith } from "@/components/ui/nav-tabs";
import { IconPlus } from "@/components/ui/icons";
import { EPISTEMIC_KINDS, POST_TYPES, SORTS, parseSort, type PostKind, type PostTypeKey } from "@/lib/content";
import { oneParam, pageParam, plural } from "@/lib/format";

type SP = Record<string, string | string[] | undefined>;

/** Vista de un foro (o de una de sus subcategorías) con filtros por tipo, clasificación y «Sin responder». */
export async function ForumView({
  forum,
  sub,
  sp,
  canWrite,
  firstName,
}: {
  forum: Forum & { categories: Subcategory[] };
  sub: Subcategory | null;
  sp: SP;
  canWrite: boolean;
  firstName: string;
}) {
  const sort = parseSort(oneParam(sp.orden));
  const typeParam = oneParam(sp.tipo);
  const type = POST_TYPES.some((t) => t.key === typeParam) ? (typeParam as PostTypeKey) : null;
  const kindParam = oneParam(sp.clase);
  const kind = EPISTEMIC_KINDS.some((k) => k.key === kindParam) ? (kindParam as PostKind) : null;
  const unanswered = oneParam(sp.sin_responder) === "1";
  const tag = oneParam(sp.etiqueta) || null;
  const page = pageParam(sp.pagina);
  const base = sub ? `/comunidad/${forum.slug}/${sub.slug}` : `/comunidad/${forum.slug}`;
  const current = {
    orden: sort === "recent" ? undefined : sort,
    tipo: type ?? undefined,
    clase: kind ?? undefined,
    sin_responder: unanswered ? "1" : undefined,
    etiqueta: tag ?? undefined,
  };
  const filtered = Boolean(type || kind || unanswered || tag);

  const [{ items, hasMore }, stats] = await Promise.all([
    getFeed({ forum: forum.slug, category: sub?.slug ?? null, sort, type, kind, unanswered, tag, page }),
    getForumStats(),
  ]);
  const s = sub ? stats.byCategory.get(sub.slug) : stats.byForum.get(forum.slug);
  const publishHref = `/publicar?foro=${forum.slug}${sub ? `&sub=${sub.slug}` : ""}`;

  return (
    <>
      <nav aria-label="Ubicación" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/comunidad" className="link-draw hover:text-accent">
          ← Comunidad
        </Link>
        {sub && (
          <>
            <span aria-hidden="true">›</span>
            <Link href={`/comunidad/${forum.slug}`} className="link-draw hover:text-accent">
              {forum.name}
            </Link>
          </>
        )}
      </nav>
      <PageHeader eyebrow={sub ? `${forum.name} · subcategoría` : "Foro"} title={sub?.name ?? forum.name} lead={sub?.description || forum.description}>
        {canWrite && (
          <Link href={publishHref} className="btn btn-primary">
            <IconPlus size={18} /> Publicar aquí
          </Link>
        )}
      </PageHeader>

      {forum.categories.length > 0 && (
        <NavTabs
          label={`Subcategorías de ${forum.name}`}
          active={sub?.slug ?? "_todo"}
          items={[
            { key: "_todo", label: "Todo", href: `/comunidad/${forum.slug}` },
            ...forum.categories.map((c) => ({ key: c.slug, label: c.name, href: `/comunidad/${forum.slug}/${c.slug}` })),
          ]}
        />
      )}

      <div className="mt-8 grid gap-12 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          {forum.slug === "agora" && !sub && canWrite && (
            <div className="mb-8">
              <QuickPost name={firstName} />
            </div>
          )}
          <NavTabs
            label="Ordenar"
            active={sort}
            items={SORTS.map((x) => ({
              key: x.key,
              label: x.label,
              short: x.short,
              href: hrefWith(base, current, { orden: x.key === "recent" ? undefined : x.key }),
            }))}
          />
          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
            <Link href={hrefWith(base, current, { tipo: undefined })} className="chip !min-h-8 shrink-0" aria-current={!type ? "page" : undefined}>
              Todos los tipos
            </Link>
            {POST_TYPES.map((t) => (
              <Link
                key={t.key}
                href={hrefWith(base, current, { tipo: t.key })}
                className="chip !min-h-8 shrink-0"
                aria-current={type === t.key ? "page" : undefined}
              >
                {t.name}
              </Link>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Link
              href={hrefWith(base, current, { sin_responder: unanswered ? undefined : "1" })}
              className="chip !min-h-8"
              aria-current={unanswered ? "page" : undefined}
            >
              Sin responder{s?.unanswered ? ` · ${s.unanswered}` : ""}
            </Link>
            {EPISTEMIC_KINDS.map((k) => (
              <Link
                key={k.key}
                href={hrefWith(base, current, { clase: kind === k.key ? undefined : k.key })}
                className="chip !min-h-8"
                aria-current={kind === k.key ? "page" : undefined}
                title={k.description}
              >
                {k.short}
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
              showCategory={!sub}
              empty={
                <>
                  {filtered ? "Nada coincide con estos filtros todavía." : "Todavía no hay publicaciones aquí."}{" "}
                  {canWrite && (
                    <Link href={publishHref} className="link">
                      Abre la primera conversación
                    </Link>
                  )}
                </>
              }
            />
            <Pagination page={page} hasMore={hasMore} hrefFor={(n) => hrefWith(base, current, { pagina: n > 1 ? String(n) : undefined })} />
          </div>
        </div>

        <aside className="space-y-8 xl:sticky xl:top-8 xl:self-start">
          <div className="rounded-xl bg-surface-2 p-5">
            <p className="label mb-3">Normas de {forum.name}</p>
            <ul className="space-y-2 text-[0.9375rem] leading-relaxed text-ink-2">
              {forum.rules
                .split("\n")
                .filter(Boolean)
                .map((r) => (
                  <li key={r} className="flex gap-2">
                    <span aria-hidden="true" className="text-accent">
                      ·
                    </span>
                    {r}
                  </li>
                ))}
            </ul>
            <Link href="/normas" className="link mt-4 inline-block text-sm">
              Normas generales de la comunidad
            </Link>
          </div>
          {s && (
            <p className="text-sm text-muted">
              {plural(s.count, "publicación", "publicaciones")} · {s.unanswered} sin responder
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
