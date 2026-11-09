import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { RichText } from "@/components/ui/rich-text";
import { timeAgo } from "@/lib/format";
import type { CommentNode, ReactionState } from "@/lib/data/posts";
import { CommentControls } from "./comment-client";

type Ctx = {
  postId: string;
  userId: string;
  isStaff: boolean;
  canWrite: boolean;
  locked: boolean;
  reactions: Map<string, ReactionState>;
  empty: ReactionState;
};

/** Hilo de comentarios. A partir del tercer nivel deja de sangrar para que se lea bien en móvil. */
export function CommentThread({ roots, ctx }: { roots: CommentNode[]; ctx: Ctx }) {
  return (
    <ol className="space-y-1">
      {roots.map((c) => (
        <CommentItem key={c.id} c={c} ctx={ctx} level={0} />
      ))}
    </ol>
  );
}

function CommentItem({ c, ctx, level, replyTo }: { c: CommentNode; ctx: Ctx; level: number; replyTo?: string }) {
  const name = c.author?.display_name ?? c.author?.username ?? "Miembro";
  const deleted = Boolean(c.deleted_at);
  const mine = c.author_id === ctx.userId;
  const indent = level > 0 && level < 4;
  return (
    <li className={indent ? "border-l border-line-2 pl-4 sm:pl-5" : ""}>
      <article id={`c-${c.id}`} className="scroll-mt-24 py-3">
        <header className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.8125rem]">
          {deleted ? (
            <span className="text-muted">Comentario eliminado</span>
          ) : (
            <>
              <Link href={`/miembros/${c.author?.username}`} className="flex items-center gap-2 font-medium text-ink hover:text-accent">
                <Avatar url={c.author?.avatar_url} name={name} size={26} />
                {name}
              </Link>
              {replyTo && level >= 4 && <span className="text-muted">en respuesta a {replyTo}</span>}
            </>
          )}
          <span className="text-muted">·</span>
          <a href={`#c-${c.id}`} className="text-muted hover:text-accent">
            <time dateTime={c.created_at}>{timeAgo(c.created_at)}</time>
          </a>
          {c.edited_at && !deleted && <span className="text-muted">· editado</span>}
        </header>
        {deleted ? (
          <p className="mt-2 text-[0.9375rem] italic text-muted">Este comentario ya no está disponible.</p>
        ) : (
          <>
            <RichText text={c.body} className="prose-doc mt-2 !text-[0.98rem]" />
            <CommentControls
              postId={ctx.postId}
              commentId={c.id}
              body={c.body}
              reactions={ctx.reactions.get(c.id) ?? ctx.empty}
              canReply={ctx.canWrite && !ctx.locked}
              canEdit={mine && ctx.canWrite}
              canDelete={mine || ctx.isStaff}
              canReport={!mine}
            />
          </>
        )}
      </article>
      {c.children.length > 0 && (
        <ol className="space-y-1">
          {c.children.map((child) => (
            <CommentItem key={child.id} c={child} ctx={ctx} level={level + 1} replyTo={name} />
          ))}
        </ol>
      )}
    </li>
  );
}
