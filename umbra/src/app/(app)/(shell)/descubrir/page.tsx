import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { profilePhotos } from "@/lib/data/feed";
import { getAffinityMembers, getNewMembers } from "@/lib/data/members";
import { getForums } from "@/lib/data/posts";
import { discoverCircles } from "@/lib/data/circles";
import { createClient } from "@/lib/supabase/server";
import { PhotoGrid } from "@/components/feed/photo-grid";
import { SuggestedPeople } from "@/components/feed/suggested-people";
import { IconSearch } from "@/components/ui/icons";
import { plural } from "@/lib/format";

export const metadata: Metadata = { title: "Descubrir" };

export default async function DescubrirPage() {
  const { profile } = await requireOnboardedMember();
  const supabase = await createClient();
  const [photos, affinity, newcomers, forums, circles, { data: myFollows }] = await Promise.all([
    profilePhotos(null, 24),
    getAffinityMembers(8),
    getNewMembers(8),
    getForums(),
    discoverCircles(profile.id, ""),
    supabase.from("member_follows").select("followed_id").eq("follower_id", profile.id),
  ]);
  const followed = new Set((myFollows ?? []).map((f) => f.followed_id));
  const seen = new Set<string>();
  const people = [...affinity, ...newcomers].filter((m) => !followed.has(m.id) && !seen.has(m.id) && (seen.add(m.id), true)).slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl">
      <form action="/buscar" role="search" className="card mb-8 flex items-center gap-3 px-4">
        <IconSearch size={20} className="shrink-0 text-muted" />
        <label htmlFor="dq" className="sr-only">
          Buscar
        </label>
        <input id="dq" name="q" placeholder="Buscar personas, ideas, libros, círculos…" className="min-h-13 w-full bg-transparent py-3.5 text-[1.0625rem] outline-none" />
      </form>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="d-fotos">
            <h2 id="d-fotos" className="mb-3 text-lg font-semibold text-ink">
              Fotos de la comunidad
            </h2>
            <div className="-mx-4 sm:mx-0">
              <PhotoGrid
                photos={photos}
                empty={
                  <>
                    Aún no hay fotos.{" "}
                    <Link href="/crear/foto" className="link">
                      Comparte la primera
                    </Link>
                    .
                  </>
                }
              />
            </div>
          </section>

          <section aria-labelledby="d-foros">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="d-foros" className="text-lg font-semibold text-ink">
                Espacios de la comunidad
              </h2>
              <Link href="/comunidad" className="text-sm font-medium text-accent">
                Ver todos
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {forums.map((f) => (
                <li key={f.slug}>
                  <Link href={`/comunidad/${f.slug}`} className="card block h-full p-4 transition-colors hover:border-accent-mid">
                    <span className="block font-semibold text-ink">{f.name}</span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-snug text-muted">{f.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {circles.length > 0 && (
            <section aria-labelledby="d-circulos">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 id="d-circulos" className="text-lg font-semibold text-ink">
                  Círculos para unirte
                </h2>
                <Link href="/circulos?ver=descubrir" className="text-sm font-medium text-accent">
                  Ver todos
                </Link>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {circles.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <Link href={`/circulos/${c.slug}`} className="card block p-4 transition-colors hover:border-accent-mid">
                      <span className="block font-semibold text-ink">{c.name}</span>
                      <span className="text-xs text-muted">{plural(c.member_count, "miembro", "miembros")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <aside className="space-y-8">
          <div className="card p-5">
            <SuggestedPeople people={people} title="Personas afines" />
            {people.length === 0 && <p className="text-sm text-muted">Ya sigues a todas las personas que te sugeriríamos.</p>}
          </div>
          <Link href="/libros" className="card block p-5 transition-colors hover:border-accent-mid">
            <span className="label">Biblioteca</span>
            <span className="mt-2 block font-semibold text-ink">Libros recomendados por la comunidad</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
