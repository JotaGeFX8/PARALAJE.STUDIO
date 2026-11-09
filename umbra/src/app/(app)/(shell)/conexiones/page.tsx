import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { discoverMembers, memberCountries, myNetwork, searchMembers } from "@/lib/data/social";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { NavTabs, Pagination, hrefWith } from "@/components/ui/nav-tabs";
import { EmptyState } from "@/components/ui/section";
import { Avatar } from "@/components/ui/avatar";
import { DiscoverDeck } from "@/components/social/discover-deck";
import { MemberResult } from "@/components/social/member-result";
import { ConnectButton } from "@/components/social/connect-button";
import { AREAS, AVAILABILITY_LABELS } from "@/lib/content";
import { oneParam, pageParam, timeAgo } from "@/lib/format";
import type { ChatAvailability } from "@/lib/supabase/types";

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
          <li>Te proponemos personas por intereses compartidos y disponibilidad para conversar.</li>
          <li>«Conectar» envía una solicitud; si la acepta, podréis escribiros en privado.</li>
          <li>«Pasar» no avisa a nadie y no te volverá a mostrar ese perfil en 30 días.</li>
          <li>Esto no es una app de citas: aquí se conecta por ideas, oficios y proyectos.</li>
        </ul>
      </aside>
    </div>
  );
}

async function Search({ sp }: { sp: SP }) {
  const supabase = await createClient();
  const [{ data: interests }, countries] = await Promise.all([
    supabase.from("interests").select("slug, name").order("position"),
    memberCountries(),
  ]);
  const chosen = (Array.isArray(sp.i) ? sp.i : sp.i ? [sp.i] : []).filter((x) => /^[a-z0-9-]{2,40}$/.test(x));
  const q = oneParam(sp.q).slice(0, 80);
  const country = oneParam(sp.pais).slice(0, 60);
  const region = oneParam(sp.region).slice(0, 80);
  const dispRaw = oneParam(sp.disp);
  const availability = (["open", "sometimes", "closed"].includes(dispRaw) ? dispRaw : null) as ChatAvailability | null;
  const withProjects = oneParam(sp.proyectos) === "1";
  const page = pageParam(sp.pagina);
  const active = Boolean(q || chosen.length || country || region || availability || withProjects);
  const { items, hasMore } = await searchMembers({ q, interests: chosen, country, region, availability, withProjects, page });
  const current = {
    ver: "buscar",
    q: q || undefined,
    pais: country || undefined,
    region: region || undefined,
    disp: availability ?? undefined,
    proyectos: withProjects ? "1" : undefined,
  };
  const iParams = chosen.map((c) => `&i=${encodeURIComponent(c)}`).join("");

  return (
    <div className="grid gap-10 lg:grid-cols-[17rem_1fr]">
      <form action="/conexiones" className="space-y-7 lg:sticky lg:top-8 lg:self-start">
        <input type="hidden" name="ver" value="buscar" />
        <div>
          <label htmlFor="mq" className="label block">
            Texto libre
          </label>
          <input id="mq" name="q" defaultValue={q} placeholder="huerta, telescopio, adobe…" className="field" />
        </div>
        <fieldset>
          <legend className="label mb-3">Intereses</legend>
          <div className="flex flex-wrap gap-1.5">
            {(interests ?? []).map((it) => (
              <label key={it.slug} className="chip !min-h-8 cursor-pointer !px-3 !text-[0.8125rem]">
                <input type="checkbox" name="i" value={it.slug} defaultChecked={chosen.includes(it.slug)} className="sr-only" />
                {it.name}
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
          Con proyectos personales
        </label>
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
          hrefFor={(n) => hrefWith("/conexiones", current, { pagina: n > 1 ? String(n) : undefined }) + iParams}
        />
      </div>
    </div>
  );
}

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
            {[person?.region, person?.country].filter(Boolean).join(", ") || `@${person?.username}`}
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
