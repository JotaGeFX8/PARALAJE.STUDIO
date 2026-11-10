"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { setReactionAction, setSavedAction } from "@/app/(app)/actions/posts";
import { Avatar } from "@/components/ui/avatar";
import { RichText } from "@/components/ui/rich-text";
import { IconBookmark, IconComment, IconHeart, IconShare } from "@/components/ui/icons";
import { KindBadge, TypeBadge } from "@/components/posts/kind-badge";
import { timeAgo } from "@/lib/format";
import type { FeedEntry } from "@/lib/data/feed";

/** Publicación en el feed: cabecera, fotos en carrusel, acciones, pie y comentarios. */
export function FeedCard({ p, priority = false }: { p: FeedEntry; priority?: boolean }) {
  const [liked, setLiked] = useState(p.liked);
  const [likes, setLikes] = useState(p.likes);
  const [saved, setSaved] = useState(p.saved);
  const [burst, setBurst] = useState(false);
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, start] = useTransition();
  const track = useRef<HTMLDivElement>(null);
  const href = `/p/${p.id}`;
  const where = p.forum_slug ? { href: `/comunidad/${p.forum_slug}`, label: p.forum_name } : p.area_name ? { href: null, label: p.area_name } : null;

  function toggleLike(force?: boolean) {
    const on = force ?? !liked;
    if (on === liked) return;
    setLiked(on);
    setLikes((n) => n + (on ? 1 : -1));
    start(async () => {
      const r = await setReactionAction("post", p.id, "like", on);
      if (!r.ok) {
        setLiked(!on);
        setLikes((n) => n + (on ? -1 : 1));
      }
    });
  }

  function toggleSave() {
    const on = !saved;
    setSaved(on);
    start(async () => {
      const r = await setSavedAction(p.id, on);
      if (!r.ok) setSaved(!on);
    });
  }

  async function share() {
    const url = new URL(href, window.location.origin).toString();
    try {
      if (navigator.share) return void (await navigator.share({ title: p.title ?? "Publicación", url }));
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* cancelado */
    }
  }

  function go(i: number) {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <article className="card overflow-hidden max-sm:-mx-5 max-sm:rounded-none max-sm:border-x-0" aria-labelledby={`fc-${p.id}`}>
      <header className="flex items-center gap-3 px-4 py-3">
        <Link href={`/miembros/${p.author_username}`} className="shrink-0" aria-label={`Perfil de ${p.author_name}`}>
          <Avatar url={p.author_avatar} name={p.author_name} size={38} />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <Link href={`/miembros/${p.author_username}`} id={`fc-${p.id}`} className="block truncate text-[0.9375rem] font-semibold text-ink hover:text-accent">
            {p.author_name}
          </Link>
          <span className="block truncate text-xs text-muted">
            {where ? (
              where.href ? (
                <Link href={where.href} className="hover:text-accent">
                  {where.label}
                </Link>
              ) : (
                where.label
              )
            ) : (
              `@${p.author_username}`
            )}{" "}
            · <time dateTime={p.created_at}>{timeAgo(p.created_at)}</time>
          </span>
        </div>
        {p.post_type !== "photo" && <TypeBadge type={p.post_type} />}
      </header>

      {p.images.length > 0 ? (
        <div className="relative bg-surface-2">
          <div
            ref={track}
            className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={(e) => {
              const el = e.currentTarget;
              setIndex(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
            }}
            onDoubleClick={() => {
              toggleLike(true);
              setBurst(true);
              setTimeout(() => setBurst(false), 700);
            }}
          >
            {p.images.map((img, i) => (
              <div key={img.path} className="relative aspect-[4/5] w-full shrink-0 snap-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal del bucket privado */}
                <img
                  src={img.url}
                  alt={p.title ?? `Foto ${i + 1} de ${p.author_name}`}
                  loading={priority && i === 0 ? "eager" : "lazy"}
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>
          {burst && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center text-white drop-shadow-lg animate-[rise_0.7s_ease_both]">
              <IconHeart size={96} filled />
            </span>
          )}
          {p.images.length > 1 && (
            <>
              <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[0.6875rem] text-white">
                {index + 1}/{p.images.length}
              </span>
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                {p.images.map((img, i) => (
                  <button
                    key={img.path}
                    type="button"
                    aria-label={`Ver foto ${i + 1}`}
                    onClick={() => go(i)}
                    className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <Link href={href} className="block border-y border-line bg-surface-2/50 px-5 py-6 transition-colors hover:bg-surface-2">
          <div className="mb-3 flex flex-wrap gap-1.5">
            <KindBadge kind={p.kind} />
          </div>
          {p.title && <h3 className="font-serif text-[1.375rem] leading-snug text-ink">{p.title}</h3>}
          <p className={`${p.title ? "mt-2 line-clamp-3 text-[0.9375rem] text-ink-2" : "line-clamp-5 font-serif text-[1.125rem] text-ink"} leading-relaxed`}>{p.excerpt}</p>
        </Link>
      )}

      <div className="flex items-center gap-1 px-2 pt-2">
        <button
          type="button"
          onClick={() => toggleLike()}
          aria-pressed={liked}
          aria-label={liked ? "Quitar me gusta" : "Me gusta"}
          className={`grid h-11 w-11 place-items-center rounded-full transition-transform active:scale-90 ${liked ? "text-like" : "text-ink hover:text-muted"}`}
        >
          <IconHeart size={25} filled={liked} />
        </button>
        <Link href={`${href}#comentarios`} aria-label="Comentar" className="grid h-11 w-11 place-items-center rounded-full text-ink hover:text-muted">
          <IconComment size={25} />
        </Link>
        <button type="button" onClick={share} aria-label="Compartir" className="grid h-11 w-11 place-items-center rounded-full text-ink hover:text-muted">
          <IconShare size={24} />
        </button>
        {copied && (
          <span role="status" className="text-xs text-accent">
            Enlace copiado
          </span>
        )}
        <button
          type="button"
          onClick={toggleSave}
          aria-pressed={saved}
          aria-label={saved ? "Quitar de guardados" : "Guardar"}
          className={`ml-auto grid h-11 w-11 place-items-center rounded-full ${saved ? "text-accent" : "text-ink hover:text-muted"}`}
        >
          <IconBookmark size={24} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="space-y-1.5 px-4 pb-4">
        <p className="text-[0.9375rem] font-semibold text-ink">
          {likes} {likes === 1 ? "me gusta" : "me gusta"}
        </p>
        {p.images.length > 0 && p.body.trim() && (
          <div className={`text-[0.9375rem] leading-relaxed text-ink-2 ${expanded ? "" : "line-clamp-3"}`}>
            <Link href={`/miembros/${p.author_username}`} className="mr-1.5 font-semibold text-ink">
              {p.author_username}
            </Link>
            <RichText text={p.body} className="inline [&>p]:inline" />
          </div>
        )}
        {p.images.length > 0 && p.body.length > 160 && !expanded && (
          <button type="button" onClick={() => setExpanded(true)} className="text-sm text-muted hover:text-ink">
            más
          </button>
        )}
        {p.tags.length > 0 && (
          <p className="flex flex-wrap gap-x-2 text-sm text-accent">
            {p.tags.slice(0, 5).map((t) => (
              <Link key={t} href={`/etiqueta/${t}`} className="hover:underline">
                #{t}
              </Link>
            ))}
          </p>
        )}
        {p.comment_count > 0 ? (
          <Link href={`${href}#comentarios`} className="block text-sm text-muted hover:text-ink">
            Ver {p.comment_count === 1 ? "el comentario" : `los ${p.comment_count} comentarios`}
          </Link>
        ) : (
          <Link href={`${href}#comentarios`} className="block text-sm text-muted hover:text-ink">
            Añade un comentario…
          </Link>
        )}
      </div>
    </article>
  );
}

/** Esqueleto mientras carga el feed. */
export function FeedCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="skeleton h-9 w-9 !rounded-full" />
        <span className="skeleton h-3 w-32" />
      </div>
      <div className="skeleton aspect-[4/5] w-full !rounded-none" />
      <div className="space-y-2 p-4">
        <span className="skeleton block h-3 w-24" />
        <span className="skeleton block h-3 w-3/4" />
      </div>
    </div>
  );
}
