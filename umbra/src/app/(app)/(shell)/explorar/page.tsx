import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { getAffinityMembers, getNewMembers } from "@/lib/data/members";
import { createClient } from "@/lib/supabase/server";
import { AREAS, PROFILE_AREA } from "@/lib/content";
import { PageHeader } from "@/components/ui/page-header";
import { MemberRow } from "@/components/profile/member-row";
import { IconArrow } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Explorar" };

export default async function ExplorarPage({ searchParams }: { searchParams: Promise<{ bienvenida?: string }> }) {
  const { profile } = await requireOnboardedMember();
  const { bienvenida } = await searchParams;
  const supabase = await createClient();

  const [affinity, newcomers, { data: categories }] = await Promise.all([
    getAffinityMembers(profile.id),
    getNewMembers(profile.id),
    supabase.from("categories").select("slug, name, description").order("position"),
  ]);

  const firstName = (profile.display_name ?? profile.username ?? "").split(" ")[0];

  return (
    <>
      <PageHeader
        eyebrow="Explorar"
        title={bienvenida ? <>Te damos la bienvenida, {firstName}.</> : <>Hola, {firstName}.</>}
        lead={
          bienvenida
            ? "Tu perfil está listo. Desde aquí puedes descubrir personas afines y los territorios de la comunidad."
            : "Personas afines, miembros recién llegados y los territorios de conversación."
        }
      />

      {/* Accesos a las seis áreas */}
      <nav aria-label="Áreas de UMBRA" className="mb-16 grid grid-cols-2 md:mb-20 gap-px overflow-hidden border hairline bg-line sm:grid-cols-3">
        {[...AREAS.slice(1), PROFILE_AREA].map((a) => {
          const Icon = a.icon;
          const ready = a.phase <= 2;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center gap-3.5 bg-carbon px-4 py-4 transition-colors duration-300 hover:bg-graphite md:min-h-40 md:flex-col md:items-start md:justify-between md:p-6"
            >
              <Icon size={22} className="shrink-0 text-stone transition-colors group-hover:text-lichen" />
              <span className="min-w-0">
                <span className="block font-serif text-[1.0625rem] leading-tight text-bone md:text-xl">{a.name}</span>
                <span className="label mt-1.5 block !text-[0.5625rem] md:mt-2 md:!text-[0.625rem]">{ready ? a.short : `Fase ${a.phase}`}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="grid gap-16 xl:grid-cols-2 xl:gap-20">
        <section aria-labelledby="afinidad">
          <SectionTitle id="afinidad" eyebrow="Afinidad" title="Personas con tus intereses" />
          {affinity.length ? (
            <ul className="border-t hairline">{affinity.map((m) => <MemberRow key={m.id} m={m} />)}</ul>
          ) : (
            <Empty>
              Aún no hay miembros que compartan tus intereses. A medida que la comunidad crezca aparecerán aquí.
            </Empty>
          )}
        </section>

        <section aria-labelledby="nuevos">
          <SectionTitle id="nuevos" eyebrow="Recién llegados" title="Nuevos miembros" />
          {newcomers.length ? (
            <ul className="border-t hairline">{newcomers.map((m) => <MemberRow key={m.id} m={m} />)}</ul>
          ) : (
            <Empty>Eres de los primeros miembros de UMBRA. Las próximas personas en llegar aparecerán aquí.</Empty>
          )}
        </section>
      </div>

      <section aria-labelledby="territorios" className="mt-24">
        <SectionTitle id="territorios" eyebrow="Comunidad" title="Territorios" />
        <ul className="grid border-t hairline sm:grid-cols-2 sm:gap-x-10 xl:grid-cols-3">
          {(categories ?? []).map((c, i) => (
            <li key={c.slug} className="border-b hairline py-5">
              <span className="font-mono text-[0.6875rem] text-stone">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-2 font-serif text-lg text-bone">{c.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-stone">{c.description}</p>
            </li>
          ))}
        </ul>
        <Link href="/comunidad" className="link-draw mt-8 inline-flex items-center gap-2 text-sm text-stone-2 hover:text-bone">
          Ir a Comunidad <IconArrow size={16} />
        </Link>
      </section>
    </>
  );
}

function SectionTitle({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="label">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-serif text-2xl text-bone md:text-3xl">{title}</h2>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="border-t hairline pt-6 font-serif text-lg leading-relaxed text-stone">{children}</p>;
}
