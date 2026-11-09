import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { discoverCircles, myCircleInvites, myCircles } from "@/lib/data/circles";
import { PageHeader } from "@/components/ui/page-header";
import { NavTabs } from "@/components/ui/nav-tabs";
import { EmptyState } from "@/components/ui/section";
import { CircleCard } from "@/components/groups/cards";
import { IconPlus, IconSearch } from "@/components/ui/icons";
import { AREAS } from "@/lib/content";
import { oneParam } from "@/lib/format";
import type { CircleRow } from "@/lib/data/circles";

export const metadata: Metadata = { title: "Círculos" };

export default async function CirculosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { profile } = await requireOnboardedMember();
  const sp = await searchParams;
  const q = oneParam(sp.q).slice(0, 80);
  const [mine, invites] = await Promise.all([myCircles(profile.id), myCircleInvites(profile.id)]);
  const view = ["mios", "descubrir", "invitaciones"].includes(oneParam(sp.ver)) ? oneParam(sp.ver) : mine.length ? "mios" : "descubrir";

  return (
    <>
      <PageHeader eyebrow="Grupos" title="Círculos" lead={AREAS[3].description}>
        <Link href="/circulos/nuevo" className="btn btn-primary">
          <IconPlus size={18} /> Crear círculo
        </Link>
      </PageHeader>
      <NavTabs
        label="Secciones de círculos"
        active={view}
        items={[
          { key: "mios", label: "Mis círculos", href: "/circulos?ver=mios" },
          { key: "descubrir", label: "Descubrir", href: "/circulos?ver=descubrir" },
          { key: "invitaciones", label: "Invitaciones", href: "/circulos?ver=invitaciones", count: invites.length },
        ]}
      />
      <div className="mt-8">
        {view === "mios" &&
          (mine.length ? (
            <Grid circles={mine} noteFor={(c) => (c.role === "owner" ? "Creado por ti" : c.role === "admin" ? "Administras" : undefined)} />
          ) : (
            <EmptyState action={<Link href="/circulos?ver=descubrir" className="btn btn-ghost">Descubrir círculos</Link>}>
              Aún no perteneces a ningún círculo.
            </EmptyState>
          ))}
        {view === "descubrir" && <Discover userId={profile.id} q={q} />}
        {view === "invitaciones" &&
          (invites.length ? (
            <ul className="max-w-3xl border-t hairline">
              {invites.map((i) => {
                const circle = i.circle as CircleRow | null;
                if (!circle) return null;
                return (
                  <li key={i.id} className="flex flex-col gap-2 border-b hairline py-5 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      <span className="block font-serif text-xl text-ink">{circle.name}</span>
                      <span className="block text-sm text-muted">
                        Invitación de {i.inviter?.display_name ?? i.inviter?.username ?? "un miembro"}
                      </span>
                    </span>
                    <Link href={`/circulos/${circle.slug}`} className="btn btn-primary btn-sm">
                      Ver y responder
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState>No tienes invitaciones pendientes.</EmptyState>
          ))}
      </div>
    </>
  );
}

function Grid({ circles, noteFor }: { circles: (CircleRow & { role?: string })[]; noteFor?: (c: CircleRow & { role?: string }) => string | undefined }) {
  return (
    <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
      {circles.map((c) => (
        <CircleCard key={c.id} c={c} note={noteFor?.(c)} />
      ))}
    </ul>
  );
}

async function Discover({ userId, q }: { userId: string; q: string }) {
  const circles = await discoverCircles(userId, q);
  return (
    <>
      <form action="/circulos" role="search" className="boxed mb-8 flex max-w-xl items-center gap-3 px-4">
        <input type="hidden" name="ver" value="descubrir" />
        <IconSearch size={18} className="text-muted" />
        <input name="q" defaultValue={q} placeholder="Buscar círculos" aria-label="Buscar círculos" className="min-h-12 w-full bg-transparent outline-none" />
      </form>
      {circles.length ? (
        <Grid circles={circles} noteFor={(c) => ("joined" in c && c.joined ? "Eres miembro" : undefined)} />
      ) : (
        <EmptyState action={<Link href="/circulos/nuevo" className="btn btn-primary">Crear el primero</Link>}>
          {q ? `Ningún círculo coincide con «${q}».` : "Todavía no hay círculos públicos o privados. Puedes crear el primero."}
        </EmptyState>
      )}
    </>
  );
}
