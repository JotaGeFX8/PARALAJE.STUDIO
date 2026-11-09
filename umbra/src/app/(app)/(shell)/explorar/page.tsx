import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { getAffinityMembers, getNewMembers } from "@/lib/data/members";
import { getCategories, getFeed, getTrendingTags } from "@/lib/data/posts";
import { activeCircles } from "@/lib/data/circles";
import { listProjects } from "@/lib/data/projects";
import { createClient } from "@/lib/supabase/server";
import { siteSettings } from "@/lib/data/admin";
import { BRAND } from "@/config/brand";
import { AREAS, AREA_TO_CATEGORIES, PROFILE_AREA, SORTS, parseSort } from "@/lib/content";
import { oneParam, pageParam, plural, timeAgo } from "@/lib/format";
import { NavTabs, Pagination, hrefWith } from "@/components/ui/nav-tabs";
import { SectionTitle } from "@/components/ui/section";
import { Avatar } from "@/components/ui/avatar";
import { PostList } from "@/components/posts/post-row";
import { KindBadge } from "@/components/posts/kind-badge";
import { MemberRow } from "@/components/profile/member-row";
import { StatusBadge } from "@/components/groups/cards";
import { IconArrow, IconSearch } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Explorar" };

type SP = Record<string, string | string[] | undefined>;

export default async function ExplorarPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { profile } = await requireOnboardedMember();
  const sp = await searchParams;
  const sort = parseSort(oneParam(sp.orden));
  const page = pageParam(sp.pagina);
  const welcome = oneParam(sp.bienvenida) === "1";
  const supabase = await createClient();

  const [feed, debates, affinity, newcomers, circles, projects, categories, tags, { data: myInterests }, { data: activity }, settings] =
    await Promise.all([
      getFeed({ scope: "all", sort, page, limit: 12 }),
      getFeed({ scope: "forum", kind: "hypothesis", sort: "trending", limit: 3 }),
      getAffinityMembers(4),
      getNewMembers(5),
      activeCircles(3),
      listProjects({}, "active", 3),
      getCategories(),
      getTrendingTags(10),
      supabase.from("profile_topics").select("is_primary, topics(area_slug)").eq("profile_id", profile.id),
      supabase.rpc("community_activity", { p_limit: 10 }),
      siteSettings(),
    ]);

  // Áreas de mis temas (las principales primero) → territorios recomendados.
  const myAreas = (myInterests ?? [])
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
    .map((t) => t.topics?.area_slug)
    .filter((a): a is string => Boolean(a));
  const recommended = Array.from(new Set(myAreas.flatMap((a) => AREA_TO_CATEGORIES[a] ?? [])))
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean)
    .slice(0, 6) as { slug: string; name: string }[];

  const first = (profile.display_name ?? profile.username ?? "").split(" ")[0];
  const current = { orden: sort === "recent" ? undefined : sort };

  return (
    <>
      <header className="mb-8 flex flex-col gap-6 md:mb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="animate-rise">
          <p className="label">Explorar</p>
          <h1 className="display mt-4 text-[clamp(2.2rem,5.5vw,3.8rem)] text-ink">
            {welcome ? <>Te damos la bienvenida, {first}.</> : <>Hola, {first}.</>}
          </h1>
        </div>
        <form action="/buscar" role="search" className="boxed flex w-full items-center gap-3 px-4 lg:max-w-sm">
          <IconSearch size={18} className="shrink-0 text-muted" />
          <input name="q" placeholder="Buscar ideas, personas, etiquetas…" aria-label="Buscar" className="min-h-12 w-full bg-transparent outline-none" />
        </form>
      </header>

      {welcome && (
        <section className="mb-10 rounded-sm bg-surface-2 p-6 md:p-8">
          {settings.welcome_message && (
            <p className="mb-5 whitespace-pre-line border-l-2 border-accent pl-4 font-serif text-lg leading-relaxed text-ink-2">
              {settings.welcome_message}
            </p>
          )}
          <p className="font-serif text-xl text-ink">Tu perfil está listo. Tres buenos primeros pasos:</p>
          <ol className="mt-4 grid gap-3 text-[0.9375rem] sm:grid-cols-3">
            {[
              ["/conexiones", "Descubre personas afines"],
              ["/circulos?ver=descubrir", "Únete a un círculo"],
              ["/agora", "Preséntate en el Ágora"],
            ].map(([href, label], i) => (
              <li key={href}>
                <Link href={href} className="flex items-center gap-3 text-accent hover:text-accent-strong">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs text-on-accent">{i + 1}</span>
                  {label}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Accesos a las áreas */}
      <nav aria-label={`Áreas de ${BRAND.name}`} className="mb-12 grid grid-cols-2 gap-px overflow-hidden rounded-sm border hairline bg-line sm:grid-cols-3 lg:grid-cols-6">
        {[...AREAS.slice(1), PROFILE_AREA].map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.href} href={a.href} className="group flex items-center gap-3 bg-canvas px-4 py-4 transition-colors hover:bg-surface-2">
              <Icon size={20} className="shrink-0 text-accent-mid transition-colors group-hover:text-accent" />
              <span className="font-serif text-[1.0625rem] text-ink">{a.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="grid gap-14 xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-16">
        {/* Columna principal: publicaciones */}
        <section aria-labelledby="feed">
          <SectionTitle id="feed" eyebrow="Comunidad y Ágora" title="Lo que se está conversando" />
          <NavTabs
            label="Ordenar publicaciones"
            active={sort}
            items={SORTS.map((s) => ({ key: s.key, label: s.label, short: s.short, href: hrefWith("/explorar", {}, { orden: s.key === "recent" ? undefined : s.key }) }))}
          />
          <div className="mt-2">
            <PostList
              items={feed.items}
              empty={
                <>
                  Todavía no hay publicaciones. Puedes abrir la primera conversación en el{" "}
                  <Link href="/agora" className="link">
                    Ágora
                  </Link>{" "}
                  o en un{" "}
                  <Link href="/comunidad" className="link">
                    territorio
                  </Link>
                  .
                </>
              }
            />
            <Pagination page={page} hasMore={feed.hasMore} hrefFor={(n) => hrefWith("/explorar", current, { pagina: n > 1 ? String(n) : undefined })} />
          </div>
        </section>

        {/* Columna lateral */}
        <aside className="space-y-12">
          {recommended.length > 0 && (
            <section>
              <SectionTitle eyebrow="Para ti" title="Temáticas recomendadas" />
              <div className="flex flex-wrap gap-2">
                {recommended.map((c) => (
                  <Link key={c.slug} href={`/comunidad/${c.slug}`} className="chip !min-h-9">
                    {c.name}
                  </Link>
                ))}
              </div>
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Link key={t.slug} href={`/etiqueta/${t.slug}`} className="tag">
                      #{t.slug}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {debates.items.length > 0 && (
            <section>
              <SectionTitle eyebrow="Hipótesis en discusión" title="Debates abiertos" href="/comunidad" />
              <ul className="space-y-4 border-t hairline pt-4">
                {debates.items.map((d) => (
                  <li key={d.id}>
                    <Link href={`/p/${d.id}`} className="group block">
                      <KindBadge kind={d.kind} />
                      <span className="mt-2 block font-serif text-[1.0625rem] leading-snug text-ink group-hover:text-accent">{d.title ?? d.excerpt}</span>
                      <span className="mt-1 block text-xs text-muted">{plural(d.comment_count, "comentario", "comentarios")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <SectionTitle eyebrow="Afinidad" title="Personas con tus intereses" href="/conexiones" hrefLabel="Descubrir" />
            {affinity.length ? (
              <ul className="border-t hairline">{affinity.map((m) => <MemberRow key={m.id} m={m} />)}</ul>
            ) : (
              <p className="border-t hairline pt-4 text-sm leading-relaxed text-muted">
                Aún no hay miembros que compartan tus intereses. A medida que la comunidad crezca aparecerán aquí.
              </p>
            )}
          </section>

          <section>
            <SectionTitle eyebrow="Grupos" title="Círculos activos" href="/circulos?ver=descubrir" />
            {circles.length ? (
              <ul className="space-y-4 border-t hairline pt-4">
                {circles.map((c) => (
                  <li key={c.id}>
                    <Link href={`/circulos/${c.slug}`} className="group block">
                      <span className="block font-serif text-[1.0625rem] text-ink group-hover:text-accent">{c.name}</span>
                      <span className="text-xs text-muted">
                        {plural(c.member_count, "miembro", "miembros")} · actividad {timeAgo(c.last_activity_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t hairline pt-4 text-sm text-muted">
                Todavía no hay círculos.{" "}
                <Link href="/circulos/nuevo" className="link">
                  Crea el primero
                </Link>
                .
              </p>
            )}
          </section>

          <section>
            <SectionTitle eyebrow="Iniciativas" title="Proyectos destacados" href="/proyectos" />
            {projects.length ? (
              <ul className="space-y-4 border-t hairline pt-4">
                {projects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/proyectos/${p.slug}`} className="group block">
                      <StatusBadge status={p.status} />
                      <span className="mt-2 block font-serif text-[1.0625rem] text-ink group-hover:text-accent">{p.title}</span>
                      <span className="text-xs text-muted">{plural(p.participant_count, "participante", "participantes")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t hairline pt-4 text-sm text-muted">
                Aún no hay proyectos.{" "}
                <Link href="/proyectos/nuevo" className="link">
                  Publica uno
                </Link>
                .
              </p>
            )}
          </section>

          <section>
            <SectionTitle eyebrow="Recién llegados" title="Nuevos miembros" />
            {newcomers.length ? (
              <ul className="border-t hairline">{newcomers.map((m) => <MemberRow key={m.id} m={m} />)}</ul>
            ) : (
              <p className="border-t hairline pt-4 text-sm text-muted">Eres de los primeros miembros de {BRAND.name}.</p>
            )}
          </section>

          {activity && activity.length > 0 && (
            <section>
              <SectionTitle eyebrow="En directo" title="Actividad de la comunidad" />
              <ol className="relative space-y-4 border-l border-line-2 pl-5">
                {activity.map((a, i) => {
                  const href =
                    a.kind === "post" ? `/p/${a.ref}` : a.kind === "project" ? `/proyectos/${a.ref}` : a.kind === "circle" ? `/circulos/${a.ref}` : `/miembros/${a.ref}`;
                  const verb =
                    a.kind === "post" ? "publicó" : a.kind === "project" ? "inició el proyecto" : a.kind === "circle" ? "creó el círculo" : "se unió a la comunidad";
                  return (
                    <li key={`${a.kind}-${a.ref}-${i}`} className="relative">
                      <span aria-hidden="true" className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full border border-accent-mid bg-canvas" />
                      <Link href={href} className="group flex gap-3">
                        <Avatar url={a.actor_avatar} name={a.actor_name ?? ""} size={26} />
                        <span className="text-sm leading-snug text-ink-2">
                          <span className="font-medium text-ink">{a.actor_name}</span> {verb}
                          {a.title && <span className="text-ink group-hover:text-accent"> «{a.title}»</span>}
                          <span className="mt-0.5 block text-xs text-muted">{timeAgo(a.at)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          <Link href="/comunidad" className="link-draw inline-flex items-center gap-2 text-sm text-ink-2 hover:text-accent">
            Ir a los territorios <IconArrow size={15} />
          </Link>
        </aside>
      </div>
    </>
  );
}
