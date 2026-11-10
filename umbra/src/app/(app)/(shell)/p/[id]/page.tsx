import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getCommentTree, getPost, getReactions } from "@/lib/data/posts";
import { Avatar } from "@/components/ui/avatar";
import { RichText } from "@/components/ui/rich-text";
import { KindBadge, TypeBadge } from "@/components/posts/kind-badge";
import { PollWidget } from "@/components/posts/poll-widget";
import { DraftActions } from "@/components/feed/draft-actions";
import { ReactionBar } from "@/components/posts/reaction-bar";
import { PostActions } from "@/components/posts/post-actions";
import { CommentThread } from "@/components/posts/comment-thread";
import { CommentForm } from "@/components/posts/comment-client";
import { NavTabs } from "@/components/ui/nav-tabs";
import { IconDownload, IconFile, IconLock, IconPin } from "@/components/ui/icons";
import { fileSize, formatDate, oneParam, plural, timeAgo } from "@/lib/format";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const UUID = /^[0-9a-f-]{36}$/i;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: "Publicación", robots: { index: false }, alternates: { canonical: `/p/${id}` } };
}

export default async function PostPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { profile } = await requireOnboardedMember();
  const sp = await searchParams;
  const order = oneParam(sp.comentarios) === "valorados" ? "valued" : "oldest";

  const post = await getPost(id, profile.id);
  if (!post) notFound();
  const [{ roots, total }, reactions] = await Promise.all([getCommentTree(id, order), getReactions(id)]);

  const isStaff = profile.role === "admin" || profile.role === "moderator";
  const canWrite = profile.role !== "restricted";
  const mine = post.author_id === profile.id;
  const author = post.author;
  const authorName = author?.display_name ?? author?.username ?? "Miembro";
  const crumbs = post.circle_id
    ? [{ href: `/circulos/${post.circle_id}`, label: "Círculo" }]
    : [
        { href: `/comunidad/${post.forum?.slug ?? "agora"}`, label: post.forum?.name ?? "Ágora" },
        ...(post.category ? [{ href: `/comunidad/${post.forum?.slug}/${post.category.slug}`, label: post.category.name }] : []),
      ];
  const notice = oneParam(sp.aviso) === "adjuntos";

  return (
    <article className="max-w-3xl">
      <nav aria-label="Ubicación" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">›</span>}
            <Link href={c.href} className="link-draw hover:text-accent">
              {i === 0 && "← "}
              {c.label}
            </Link>
          </span>
        ))}
      </nav>
      {post.is_draft && (
        <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-strong">
          <span>Borrador: solo tú puedes verlo.</span>
          <DraftActions id={post.id} />
        </div>
      )}
      {notice && (
        <p role="alert" className="mb-6 border-l-2 border-danger bg-danger-soft px-4 py-3 text-sm text-ink">
          La publicación se guardó, pero algún archivo no se pudo adjuntar. Puedes intentarlo de nuevo desde «Editar».
        </p>
      )}

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={post.post_type} />
          <KindBadge kind={post.kind} />
          {post.is_pinned && (
            <span className="flex items-center gap-1 text-xs text-accent">
              <IconPin size={14} /> Fijada
            </span>
          )}
          {post.is_locked && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <IconLock size={14} /> Conversación cerrada
            </span>
          )}
        </div>
        {post.title && (
          <h1 className="display mt-5 animate-rise text-[clamp(2rem,5vw,3.25rem)] !leading-[1.08] text-ink">{post.title}</h1>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
          <Link href={`/miembros/${author?.username}`} className="flex items-center gap-2.5 hover:text-accent">
            <Avatar url={author?.avatar_url} name={authorName} size={34} />
            <span>
              <span className="block font-medium text-ink">{authorName}</span>
              <span className="block font-mono text-xs">@{author?.username}</span>
            </span>
          </Link>
          <span aria-hidden="true">·</span>
          <time dateTime={post.created_at} title={formatDate(post.created_at)}>
            {timeAgo(post.created_at)}
          </time>
          {post.edited_at && <span>· editada</span>}
        </div>
      </header>

      <div className={post.title ? "mt-9" : "mt-6"}>
        <RichText text={post.body} className={`prose-doc ${post.title ? "" : "!text-[1.1875rem]"}`} />
      </div>

      {post.images.length > 0 &&
        (post.post_type === "photo" || post.images.length > 2 ? (
          <div className="mt-8 max-sm:-mx-5">
            <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto sm:rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {post.images.map((img, i) => (
                <a key={img.path} href={img.url} target="_blank" rel="noopener" className="relative aspect-[4/5] w-full shrink-0 snap-center bg-surface-2 sm:w-[85%]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal del bucket privado */}
                  <img src={img.url} alt={post.image_alt || `Foto ${i + 1} de ${post.images.length}`} loading={i === 0 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />
                  {post.images.length > 1 && (
                    <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 font-mono text-xs text-white">
                      {i + 1}/{post.images.length}
                    </span>
                  )}
                </a>
              ))}
            </div>
            {post.images.length > 1 && <p className="mt-2 text-center text-xs text-muted">Desliza para ver todas las fotos</p>}
          </div>
        ) : (
          <div className={`mt-8 grid gap-2 ${post.images.length > 1 ? "grid-cols-2" : ""}`}>
            {post.images.map((img) => (
              <a key={img.path} href={img.url} target="_blank" rel="noopener" className="block overflow-hidden rounded-xl border border-line bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal del bucket privado */}
                <img src={img.url} alt={post.image_alt || ""} loading="lazy" className="max-h-[32rem] w-full object-cover" />
              </a>
            ))}
          </div>
        ))}

      {post.poll && (
        <PollWidget
          postId={post.id}
          poll={post.poll}
          canVote={!post.is_locked}
          canClose={mine || isStaff}
        />
      )}

      {post.attachments.length > 0 && (
        <section className="mt-9">
          <h2 className="label mb-3">Archivos</h2>
          <ul className="space-y-2">
            {post.attachments.map((a) => (
              <li key={a.id}>
                <a
                  href={a.url ?? undefined}
                  rel="noopener nofollow"
                  className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 transition-colors hover:border-accent-mid"
                >
                  <IconFile size={20} className="shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate text-[0.9375rem] text-ink">{a.name}</span>
                  <span className="shrink-0 font-mono text-xs text-muted">{fileSize(a.size)}</span>
                  <IconDownload size={18} className="shrink-0 text-accent" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {post.sources.length > 0 && (
        <section className="mt-9 rounded-xl bg-surface-2 p-5">
          <h2 className="label mb-3">Fuentes</h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-[0.9375rem] text-ink-2 marker:text-muted">
            {post.sources.map((s, i) => (
              <li key={i} className="break-words">
                {/^https?:\/\//.test(s) ? (
                  <a href={s} target="_blank" rel="noopener noreferrer nofollow ugc" className="link">
                    {s}
                  </a>
                ) : (
                  s
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {post.tags.length > 0 && (
        <div className="mt-7 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <Link key={t} href={`/etiqueta/${t}`} className="tag">
              #{t}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 space-y-2 border-y hairline py-3">
        <ReactionBar target="post" id={post.id} initial={reactions.post} />
        <PostActions
          postId={post.id}
          title={post.title ?? "Publicación"}
          saved={post.saved}
          following={post.following}
          canEdit={mine && canWrite && !post.is_locked}
          canDelete={mine || isStaff}
          canReport={!mine}
        />
      </div>

      <section aria-labelledby="comentarios" className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="comentarios" className="font-serif text-2xl text-ink">
            {total ? plural(total, "comentario", "comentarios") : "Conversación"}
          </h2>
          {total > 1 && (
            <NavTabs
              label="Ordenar comentarios"
              className="!border-0"
              active={order}
              items={[
                { key: "oldest", label: "Cronológico", href: `/p/${id}#comentarios` },
                { key: "valued", label: "Más valorados", href: `/p/${id}?comentarios=valorados#comentarios` },
              ]}
            />
          )}
        </div>
        <div className="mt-5">
          {post.is_locked ? (
            <p className="rounded-xl bg-surface-2 p-4 text-sm text-ink-2">El equipo de moderación ha cerrado esta conversación.</p>
          ) : canWrite ? (
            <CommentForm postId={post.id} />
          ) : (
            <p className="text-sm text-muted">Tu cuenta no puede comentar por ahora.</p>
          )}
        </div>
        <div className="mt-6">
          {roots.length ? (
            <CommentThread
              roots={roots}
              ctx={{
                postId: post.id,
                userId: profile.id,
                isStaff,
                canWrite,
                locked: post.is_locked,
                reactions: reactions.comments,
                empty: reactions.empty,
              }}
            />
          ) : (
            <p className="py-6 font-serif text-lg text-muted">Nadie ha comentado todavía. Abre tú la conversación.</p>
          )}
        </div>
      </section>
    </article>
  );
}
