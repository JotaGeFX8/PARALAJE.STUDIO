import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { discoverMembers, memberCountries, myNetwork, searchMembers } from "@/lib/data/social";
import { getCatalog } from "@/lib/data/catalog";
import { PageHeader } from "@/components/ui/page-header";
import { NavTabs, Pagination, hrefWith } from "@/components/ui/nav-tabs";
import { EmptyState } from "@/components/ui/section";
import { Avatar } from "@/components/ui/avatar";
import { DiscoverDeck } from "@/components/social/discover-deck";
import { MemberResult } from "@/components/social/member-result";
import { ConnectButton } from "@/components/social/connect-button";
import { AREAS, AVAILABILITY_LABELS, GOALS, LANGUAGES, TOPIC_RELATIONS } from "@/lib/content";
import { oneParam, pageParam, timeAgo } from "@/lib/format";
import type { ChatAvailability, TopicRelation, UserGoal } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Conexiones" };

type SP = Record<string, string | string[] | undefined>;

export default async function ConexionesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { profile } = await requireOnboardedMember();
  const sp = await searchParams;
  const view = ["descubrir", "buscar", "red", "solicitudes"].includes(oneParam(sp.ver)) ? oneParam(sp.ver) : "descubrir";
  const network = await myNetwork(profile.id);

  return (
    <>
      <PageHeader eyebrow="Personas" title="Conexiones" lead={AREAS[2].description} />
      <NavTabs
        label="Secciones de conexiones"
        active={view}
        items={[
          { key: "descubrir", label: "Descubrir", href: "/conexiones" },
          { key: "buscar", label: "Buscar", href: "/conexiones?ver=buscar" },
          { key: "red", label: "Mi red", href: "/conexiones?ver=red", count: undefined },
          { key: "solicitudes", label: "Solicitudes", href: "/conexiones?ver=solicitudes", count: network.received.length },
        ]}
      />
      <div className="mt-8">
        {view === "descubrir" && <Discover />}
        {view === "buscar" && <Search sp={sp} />}
        {view === "red" && <Network network={network} />}
        {view === "solicitudes" && <Requests network={network} />}
      </div>
    </>
  );
}

async function Discover() {
  const cards = await discoverMembers(12);
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,34rem)_1fr]">
      {cards.length ? (
        <DiscoverDeck cards={cards} />
      ) : (
        <EmptyState action={<Link href="/conexiones?ver=buscar" className="btn btn-ghost">Abrir el buscador</Link>}>
          Ahora mismo no hay personas nuevas que proponerte. Cuando lleguen miembros con intereses parecidos a los tuyos,
          aparecerán aquí.
        </EmptyState>
      )}
      <aside className="hidden text-[0.9375rem] leading-relaxed text-ink-2 lg:block">
        <p className="label mb-3">Cómo funciona</p>
        <ul className="space-y-3">
          <li>Te proponemos personas por temas compartidos, por lo que podéis enseñaros o aprender juntos y por círculos en común. Cada propuesta explica por qué.</li>
          <li>«Conectar» envía una solicitud; si la acepta, podréis escribiros en privado.</li>
          <li>«Pasar» no avisa a nadie y no te volverá a mostrar ese perfil en 30 días.</li>
          <li>Esto no es una app de citas: aquí se conecta por ideas, oficios y proyectos.</li>
        </ul>
      </aside>
    </div>
  );
}

const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

async function Search({ sp }: { sp: SP }) {
  const [catalog, countries] = await Promise.all([getCatalog(), memberCountries()]);
  const areaSlugs = new Set(catalog.areas.map((a) => a.slug));
  const areas = many(sp.a).filter((x) => areaSlugs.has(x)).slice(0, 22);
  const topicId = Number(oneParam(sp.t)) || null;
  const topic = topicId ? catalog.topics.find((t) => t.id === topicId) ?? null : null;
  const relRaw = oneParam(sp.rel);
  const relation = (TOPIC_RELATIONS.some((r) => r.key === relRaw) ? relRaw : null) as TopicRelation | null;
  const goals = many(sp.o).filter((g): g is UserGoal => GOALS.some((x) => x.key === g));
  const languages = many(sp.l).filter((l) => (LANGUAGES as readonly string[]).includes(l));
  const q = oneParam(sp.q).slice(0, 80);
  const country = oneParam(sp.pais).slice(0, 60);
  const region = oneParam(sp.region).slice(0, 80);
  const dispRaw = oneParam(sp.disp);
  const availability = (["open", "sometimes", "closed"].includes(dispRaw) ? dispRaw : null) as ChatAvailability | null;
  const withProjects = oneParam(sp.proyectos) === "1";
  const inMyCircles = oneParam(sp.circulos) === "1";
  const page = pageParam(sp.pagina);
  const advanced = Boolean(topic || relation || goals.length || languages.length || country || region || availability || withProjects || inMyCircles);
  const active = Boolean(q || areas.length || advanced);
  const { items, hasMore } = await searchMembers({
    q,
    areas,
    topics: topic ? [topic.id] : [],
    relation,
    goals,
    languages,
    country,
    region,
    availability,
    withProjects,
    inMyCircles,
    page,
  });
  const current = {
    ver: "buscar",
    q: q || undefined,
    t: topic ? String(topic.id) : undefined,
    rel: relation ?? undefined,
    pais: country || undefined,
    region: region || undefined,
    disp: availability ?? undefined,
    proyectos: withProjects ? "1" : undefined,
    circulos: inMyCircles ? "1" : undefined,
  };
  const multi = [
    ...areas.map((x) => `&a=${encodeURIComponent(x)}`),
    ...goals.map((x) => `&o=${encodeURIComponent(x)}`),
    ...languages.map((x) => `&l=${encodeURIComponent(x)}`),
  ].join("");

  return (
    <div className="grid gap-10 lg:grid-cols-[19rem_1fr]">
      <form action="/conexiones" className="space-y-7 lg:sticky lg:top-8 lg:max-h-[calc(100dvh-4rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
        <input type="hidden" name="ver" value="buscar" />
        <div>
          <label htmlFor="mq" className="label block">
            Texto libre
          </label>
          <input id="mq" name="q" defaultValue={q} placeholder="huerta, telescopio, adobe…" className="field" />
        </div>
        <fieldset>
          <legend className="label mb-3">Áreas</legend>
          <div className="flex flex-wrap gap-1.5">
            {catalog.areas.map((a) => (
              <label key={a.slug} className="chip !min-h-8 cursor-pointer !px-3 !text-[0.8125rem]">
                <input type="checkbox" name="a" value={a.slug} defaultChecked={areas.includes(a.slug)} className="sr-only" />
                {a.name.split(/,| y /)[0]}
              </label>
            ))}
          </div>
        </fieldset>
        <details open={advanced} className="group">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-[0.9375rem] text-accent [&::-webkit-details-marker]:hidden">
            Más filtros
            <span aria-hidden="true" className="transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="mt-5 space-y-7">
            <div>
              <label htmlFor="mt" className="label block">
                Tema concreto
              </label>
              <select id="mt" name="t" defaultValue={topic ? String(topic.id) : ""} className="field">
                <option value="">Cualquiera</option>
                {catalog.areas.map((a) => (
                  <optgroup key={a.slug} label={a.name}>
                    {catalog.topics
                      .filter((t) => t.area === a.slug && !t.pending)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mrel" className="label block">
                Conocimientos
              </label>
              <select id="mrel" name="rel" defaultValue={relation ?? ""} className="field">
                <option value="">Cualquier relación</option>
                {TOPIC_RELATIONS.map((r) => (
                  <option key={r.key} value={r.key}>
                    {RELATION_FILTER_LABEL[r.key]}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted">Se aplica al tema elegido o, si no eliges tema, a cualquiera.</p>
            </div>
            <fieldset>
              <legend className="label mb-3">Objetivos</legend>
              <div className="flex flex-wrap gap-1.5">
                {GOALS.map((g) => (
                  <label key={g.key} className="chip !min-h-8 cursor-pointer !px-3 !text-[0.8125rem]">
                    <input type="checkbox" name="o" value={g.key} defaultChecked={goals.includes(g.key)} className="sr-only" />
                    {g.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label mb-3">Idiomas</legend>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map((l) => (
                  <label key={l} className="chip !min-h-8 cursor-pointer !px-3 !text-[0.8125rem]">
                    <input type="checkbox" name="l" value={l} defaultChecked={languages.includes(l)} className="sr-only" />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              <div>
                <label htmlFor="mpais" className="label block">
                  País
                </label>
                <select id="mpais" name="pais" defaultValue={country} className="field">
                  <option value="">Cualquiera</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="mregion" className="label block">
                  Región o ciudad
                </label>
                <input id="mregion" name="region" defaultValue={region} className="field" />
              </div>
            </div>
            <div>
              <label htmlFor="mdisp" className="label block">
                Disponibilidad
              </label>
              <select id="mdisp" name="disp" defaultValue={availability ?? ""} className="field">
                <option value="">Cualquiera</option>
                {(Object.keys(AVAILABILITY_LABELS) as ChatAvailability[]).map((k) => (
                  <option key={k} value={k}>
                    {AVAILABILITY_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-[0.9375rem] text-ink-2">
              <input type="checkbox" name="proyectos" value="1" defaultChecked={withProjects} />
              Participa en proyectos
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-[0.9375rem] text-ink-2">
              <input type="checkbox" name="circulos" value="1" defaultChecked={inMyCircles} />
              Coincide conmigo en algún círculo
            </label>
          </div>
        </details>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary flex-1">
            Buscar
          </button>
          {active && (
            <Link href="/conexiones?ver=buscar" className="btn btn-quiet">
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <div>
        <p className="label mb-3">{active ? "Resultados" : "Personas por afinidad contigo"}</p>
        {items.length ? (
          <ul className="border-t hairline">
            {items.map((m) => (
              <MemberResult key={m.id} m={m} />
            ))}
          </ul>
        ) : (
          <EmptyState>Nadie coincide con estos filtros todavía. Prueba a ampliar la búsqueda.</EmptyState>
        )}
        <Pagination
          page={page}
          hasMore={hasMore}
          hrefFor={(n) => hrefWith("/conexiones", current, { pagina: n > 1 ? String(n) : undefined }) + multi}
        />
      </div>
    </div>
  );
}

/** Cómo se lee cada relación como filtro de búsqueda. */
const RELATION_FILTER_LABEL: Record<TopicRelation, string> = {
  interested: "Le interesa",
  learning: "Está aprendiendo",
  knowledgeable: "Tiene conocimientos",
  experienced: "Tiene experiencia",
  can_teach: "Puede enseñar o ayudar",
  seeking_collaborators: "Busca colaboradores",
};

type Network = Awaited<ReturnType<typeof myNetwork>>;

function PersonLine({ person, meta, children }: { person: Network["connected"][number]["person"]; meta?: React.ReactNode; children?: React.ReactNode }) {
  const name = person?.display_name ?? person?.username ?? "Miembro";
  return (
    <li className="flex flex-col gap-4 border-b hairline py-5 sm:flex-row sm:items-center sm:justify-between">
      <Link href={`/miembros/${person?.username}`} className="flex min-w-0 items-center gap-4">
        <Avatar url={person?.avatar_url} name={name} size={48} />
        <span className="min-w-0">
          <span className="block font-serif text-lg text-ink">{name}</span>
          <span className="block text-sm text-muted">
            @{person?.username}
          </span>
          {meta}
        </span>
      </Link>
      {children}
    </li>
  );
}

function Network({ network }: { network: Network }) {
  if (!network.connected.length) {
    return (
      <EmptyState action={<Link href="/conexiones" className="btn btn-primary">Descubrir personas</Link>}>
        Todavía no tienes conexiones. Empieza por las personas que comparten tus intereses.
      </EmptyState>
    );
  }
  return (
    <ul className="max-w-3xl border-t hairline">
      {network.connected.map((c) => (
        <PersonLine key={c.id} person={c.person} meta={<span className="block text-xs text-muted">Conectados {timeAgo(c.since)}</span>}>
          {c.person && <ConnectButton otherId={c.person.id} otherName={c.person.display_name ?? ""} initial="connected" size="sm" />}
        </PersonLine>
      ))}
    </ul>
  );
}

function Requests({ network }: { network: Network }) {
  return (
    <div className="grid max-w-3xl gap-12">
      <section>
        <h2 className="label mb-3">Recibidas</h2>
        {network.received.length ? (
          <ul className="border-t hairline">
            {network.received.map((r) => (
              <PersonLine
                key={r.id}
                person={r.person}
                meta={
                  <>
                    {r.message && <span className="mt-1 block text-[0.9375rem] italic text-ink-2">«{r.message}»</span>}
                    <span className="block text-xs text-muted">{timeAgo(r.at)}</span>
                  </>
                }
              >
                {r.person && <ConnectButton otherId={r.person.id} otherName={r.person.display_name ?? ""} initial="received" size="sm" />}
              </PersonLine>
            ))}
          </ul>
        ) : (
          <p className="border-t hairline py-6 text-muted">No tienes solicitudes pendientes.</p>
        )}
      </section>
      <section>
        <h2 className="label mb-3">Enviadas</h2>
        {network.sent.length ? (
          <ul className="border-t hairline">
            {network.sent.map((r) => (
              <PersonLine key={r.id} person={r.person} meta={<span className="block text-xs text-muted">{timeAgo(r.at)}</span>}>
                {r.person && <ConnectButton otherId={r.person.id} otherName={r.person.display_name ?? ""} initial="sent" size="sm" />}
              </PersonLine>
            ))}
          </ul>
        ) : (
          <p className="border-t hairline py-6 text-muted">No hay solicitudes enviadas pendientes.</p>
        )}
      </section>
    </div>
  );
}
