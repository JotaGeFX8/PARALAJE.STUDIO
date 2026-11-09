import Link from "next/link";
import { recentComments, recentPosts } from "@/lib/data/admin";
import { KindBadge } from "@/components/posts/kind-badge";
import { ModButton, PostFlags, Reclassify } from "@/components/admin/controls";
import { modDeleteCommentAction, modDeletePostAction } from "@/app/(app)/actions/admin";
import { timeAgo, truncate } from "@/lib/format";

export default async function ContenidoPage() {
  const [posts, comments] = await Promise.all([recentPosts(40), recentComments(30)]);
  return (
    <div className="space-y-14">
      <section>
        <h2 className="label mb-3">Publicaciones recientes</h2>
        <ul className="border-t hairline">
          {posts.map((p) => (
            <li key={p.id} className="border-b hairline py-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <KindBadge kind={p.kind} />
                <span>{p.circle_id ? "Círculo" : p.category_slug ?? "Ágora"}</span>
                <span>· {p.author?.display_name ?? p.author?.username}</span>
                <span>· {timeAgo(p.created_at)}</span>
                <span>· {p.comment_count} comentarios</span>
              </div>
              <Link href={`/p/${p.id}`} className="mt-2 block font-serif text-lg text-ink hover:text-accent">
                {p.title ?? truncate(p.body, 120)}
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <PostFlags postId={p.id} locked={p.is_locked} pinned={p.is_pinned} />
                <Reclassify postId={p.id} kind={p.kind} />
                <ModButton label="Retirar" confirmLabel="Retirar publicación" askReason danger action={modDeletePostAction.bind(null, p.id)} />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="label mb-3">Comentarios recientes</h2>
        <ul className="border-t hairline">
          {comments.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 border-b hairline py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted">
                  {c.author?.display_name ?? c.author?.username} · {timeAgo(c.created_at)}
                </p>
                <Link href={`/p/${c.post_id}#c-${c.id}`} className="mt-1 block text-[0.9375rem] text-ink-2 hover:text-accent">
                  {truncate(c.body, 200)}
                </Link>
              </div>
              <ModButton label="Retirar" confirmLabel="Retirar comentario" askReason danger action={modDeleteCommentAction.bind(null, c.id)} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
