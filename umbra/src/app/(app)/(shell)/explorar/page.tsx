import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { getAffinityMembers, getNewMembers } from "@/lib/data/members";
import { getFeed } from "@/lib/data/posts";
import { getHomeFeed } from "@/lib/data/feed";
import { listBooks } from "@/lib/data/books";
import { activeCircles } from "@/lib/data/circles";
import { siteSettings } from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/server";
import { NavTabs, Pagination, hrefWith } from "@/components/ui/nav-tabs";
import { Avatar } from "@/components/ui/avatar";
import { FeedCard } from "@/components/feed/feed-card";
import { SuggestedPeople } from "@/components/feed/suggested-people";
import { BookCover } from "@/components/books/book-cover";
import { IconImage, IconPlus } from "@/components/ui/icons";
import { oneParam, pageParam, plural, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Inicio" };

type SP = Record<string, string | string[] | undefined>;

export default async function InicioPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { profile } = await requireOnboardedMember();
  const sp = await searchParams;
  const mode = oneParam(sp.ver) === "siguiendo" ? "following" : "for_you";
  const page = pageParam(sp.pagina);
  const welcome = oneParam(sp.bienvenida) === "1";
  const supabase = await createClient();

  const [feed, affinity, newcomers, { data: myFollows }, unanswered, books, circles, settings] = await Promise.all([
    getHomeFeed(mode, profile.id, page),
    getAffinityMembers(8),
    getNewMembers(8),
    supabase.from("member_follows").select("followed_id").eq("follower_id", profile.id),
    getFeed({ unanswered: true, type: "question", limit: 3 }),
    listBooks({ sort: "recent" }, 3),
    activeCircles(3),
    siteSettings(),
  ]);
  const followed = new Set((myFollows ?? []).map((f) => f.followed_id));
  const seen = new Set<string>();
  const suggestions = [...affinity, ...newcomers].filter((m) => !followed.has(m.id) && !seen.has(m.id) && (seen.add(m.id), true)).slice(0, 5);
  const first = (profile.display_name ?? profile.username ?? "").split(" ")[0];
  const current = { ver: mode === "following" ? "siguiendo" : undefined };

  return (
    <div className="mx-auto grid max-w-[64rem] gap-10 xl:grid-cols-[minmax(0,36rem)_19rem] xl:justify-between">
      <div className="min-w-0">
        {welcome && (
          <section className="card mb-6 p-5">
            {settings.welcome_message && <p className="mb-4 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink-2">{settings.welcome_message}</p>}
            <p className="font-semibold text-ink">Te damos la bienvenida, {first}. Tres buenos primeros pasos:</p>
            <ol className="mt-3 grid gap-2 text-[0.9375rem] sm:grid-cols-3">
              {[
                ["/descubrir", "Sigue a personas afines"],
                ["/crear/foto", "Comparte tu primera foto"],
                ["/comunidad/agora/presentaciones", "Preséntate en el Ágora"],
              ].map(([href, label], i) => (
                <li key={href}>
                  <Link href={href} className="flex items-center gap-2.5 text-accent hover:text-accent-strong">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs text-on-accent">{i + 1}</span>
                    {label}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <Link href="/crear/foto" className="card mb-5 flex items-center gap-3 p-3 transition-colors hover:border-accent-mid">
          <Avatar url={profile.avatar_url} name={profile.display_name ?? ""} size={40} />
          <span className="flex-1 text-[0.9375rem] text-muted">¿Qué estás explorando, {first}?</span>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
            <IconImage size={20} />
          </span>
        </Link>

        <NavTabs
          label="Feed"
          active={mode}
          className="mb-5"
          items={[
            { key: "for_you", label: "Para ti", href: "/explorar" },
            { key: "following", label: "Siguiendo", href: "/explorar?ver=siguiendo" },
          ]}
        />

        {feed.items.length ? (
          <div className="space-y-6">
            {feed.items.map((p, i) => (
              <div key={p.id}>
                <FeedCard p={p} priority={i === 0} />
                {i === 2 && page === 1 && suggestions.length > 0 && (
                  <div className="card mt-6 p-5 xl:hidden">
                    <SuggestedPeople people={suggestions.slice(0, 3)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card px-6 py-12 text-center">
            <p className="font-serif text-2xl text-ink">{mode === "following" ? "Aún no sigues a nadie." : "Todavía no hay publicaciones."}</p>
            <p className="mx-auto mt-2 max-w-sm text-[0.9375rem] text-muted">
              {mode === "following"
                ? "Sigue a personas con tus intereses y verás aquí lo que comparten."
                : "Comparte la primera foto o abre la primera conversación."}
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Link href="/descubrir" className="btn btn-primary btn-sm">
                Descubrir personas
              </Link>
              <Link href="/crear" className="btn btn-ghost btn-sm">
                <IconPlus size={16} /> Crear
              </Link>
            </div>
          </div>
        )}
        <Pagination page={page} hasMore={feed.hasMore} hrefFor={(n) => hrefWith("/explorar", current, { pagina: n > 1 ? String(n) : undefined })} />
      </div>

      <aside className="hidden space-y-8 xl:block xl:sticky xl:top-8 xl:self-start">
        <Link href="/perfil" className="flex items-center gap-3">
          <Avatar url={profile.avatar_url} name={profile.display_name ?? ""} size={48} />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-semibold text-ink">{profile.display_name}</span>
            <span className="block truncate text-sm text-muted">@{profile.username}</span>
          </span>
        </Link>
        <SuggestedPeople people={suggestions} />
        {unanswered.items.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">Preguntas sin responder</h2>
            <ul className="space-y-3">
              {unanswered.items.map((d) => (
                <li key={d.id}>
                  <Link href={`/p/${d.id}`} className="group block">
                    <span className="line-clamp-2 text-sm text-ink-2 group-hover:text-accent">{d.title ?? d.excerpt}</span>
                    <span className="text-xs text-muted">
                      {d.forum_name} · {timeAgo(d.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {books.items.length > 0 && (
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-ink">Libros recomendados</h2>
              <Link href="/libros" className="text-xs font-medium text-accent">
                Biblioteca
              </Link>
            </div>
            <ul className="space-y-3">
              {books.items.map((b) => (
                <li key={b.id}>
                  <Link href={`/libros/${b.slug}`} className="group grid grid-cols-[2.25rem_1fr] items-center gap-3">
                    <BookCover title={b.title} authors={b.authors} slug={b.slug} url={b.cover_url} size="sm" />
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-sm text-ink group-hover:text-accent">{b.title}</span>
                      <span className="block truncate text-xs text-muted">{b.authors}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {circles.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">Círculos activos</h2>
            <ul className="space-y-2.5">
              {circles.map((c) => (
                <li key={c.id}>
                  <Link href={`/circulos/${c.slug}`} className="group block leading-tight">
                    <span className="block text-sm text-ink group-hover:text-accent">{c.name}</span>
                    <span className="text-xs text-muted">{plural(c.member_count, "miembro", "miembros")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="text-xs leading-relaxed text-faint">
          <Link href="/normas" className="hover:text-muted">
            Normas
          </Link>{" "}
          ·{" "}
          <Link href="/privacidad" className="hover:text-muted">
            Privacidad
          </Link>{" "}
          ·{" "}
          <Link href="/terminos" className="hover:text-muted">
            Términos
          </Link>
        </p>
      </aside>
    </div>
  );
}
