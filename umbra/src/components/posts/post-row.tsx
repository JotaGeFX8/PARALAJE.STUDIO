import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { IconComment, IconImage, IconLock, IconPin, IconSpark } from "@/components/ui/icons";
import { KindBadge, QuestionBadge } from "./kind-badge";
import { timeAgo } from "@/lib/format";
import type { PostItem } from "@/lib/supabase/types";

/** Publicación en un listado: tipo, territorio, título, extracto y actividad. */
export function PostRow({ p, showCategory = true }: { p: PostItem; showCategory?: boolean }) {
  const href = `/p/${p.id}`;
  return (
    <li className="group border-b hairline py-6 first:pt-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.8125rem] text-muted">
        <KindBadge kind={p.kind} />
        {p.is_question && <QuestionBadge />}
        {showCategory && (
          <Link href={p.category_slug ? `/comunidad/${p.category_slug}` : "/agora"} className="hover:text-accent">
            {p.category_name ?? "Ágora"}
          </Link>
        )}
        <span aria-hidden="true">·</span>
        <time dateTime={p.created_at}>{timeAgo(p.created_at)}</time>
        {p.is_pinned && <IconPin size={15} className="text-accent" aria-label="Fijada" />}
        {p.is_locked && <IconLock size={15} aria-label="Cerrada" />}
      </div>

      <Link href={href} className="mt-3 block">
        {p.title ? (
          <>
            <h3 className="font-serif text-[1.375rem] leading-snug text-ink transition-colors group-hover:text-accent md:text-2xl">
              {p.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-[0.9375rem] leading-relaxed text-ink-2">{p.excerpt}</p>
          </>
        ) : (
          <p className="line-clamp-4 font-serif text-[1.1875rem] leading-relaxed text-ink transition-colors group-hover:text-accent">
            {p.excerpt}
          </p>
        )}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-muted">
        <Link href={`/miembros/${p.author_username}`} className="flex items-center gap-2 hover:text-accent">
          <Avatar url={p.author_avatar} name={p.author_name} size={22} />
          <span className="text-ink-2">{p.author_name}</span>
        </Link>
        <span className="flex items-center gap-1.5" title="Comentarios">
          <IconComment size={16} /> {p.comment_count}
        </span>
        <span className="flex items-center gap-1.5" title="Reacciones">
          <IconSpark size={16} /> {p.reaction_count}
        </span>
        {p.image_count > 0 && (
          <span className="flex items-center gap-1.5" title="Imágenes">
            <IconImage size={16} /> {p.image_count}
          </span>
        )}
        {p.tags.length > 0 && (
          <span className="flex flex-wrap gap-1.5">
            {p.tags.slice(0, 4).map((t) => (
              <Link key={t} href={`/etiqueta/${t}`} className="tag">
                #{t}
              </Link>
            ))}
          </span>
        )}
      </div>
    </li>
  );
}

export function PostList({ items, showCategory = true, empty }: { items: PostItem[]; showCategory?: boolean; empty: React.ReactNode }) {
  if (!items.length) {
    return <div className="border-t hairline py-10 font-serif text-lg leading-relaxed text-muted">{empty}</div>;
  }
  return (
    <ul className="border-t hairline">
      {items.map((p) => (
        <PostRow key={p.id} p={p} showCategory={showCategory} />
      ))}
    </ul>
  );
}
