import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { listBooks } from "@/lib/data/books";
import { getAreas } from "@/lib/data/catalog";
import { PageHeader } from "@/components/ui/page-header";
import { NavTabs, Pagination, hrefWith } from "@/components/ui/nav-tabs";
import { BookGrid } from "@/components/books/book-grid";
import { IconPlus } from "@/components/ui/icons";
import { BOOK_LEVELS, SHELVES, type BookLevelKey, type ShelfKey } from "@/lib/content";
import { oneParam, pageParam } from "@/lib/format";

export const metadata: Metadata = { title: "Biblioteca" };

const SORTS = [
  { key: "recent", label: "Recientes" },
  { key: "popular", label: "Más recomendados", short: "Más recomendados" },
  { key: "rated", label: "Mejor valorados", short: "Valorados" },
] as const;

export default async function LibrosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { profile } = await requireOnboardedMember();
  const sp = await searchParams;
  const view = ["todos", "estanteria", "mias"].includes(oneParam(sp.ver)) ? oneParam(sp.ver) : "todos";
  const sortRaw = oneParam(sp.orden);
  const sort = (SORTS.some((s) => s.key === sortRaw) ? sortRaw : "recent") as (typeof SORTS)[number]["key"];
  const areas = await getAreas();
  const areaRaw = oneParam(sp.area);
  const area = areas.some((a) => a.slug === areaRaw) ? areaRaw : null;
  const levelRaw = oneParam(sp.nivel);
  const level = (BOOK_LEVELS.some((l) => l.key === levelRaw) ? levelRaw : null) as BookLevelKey | null;
  const shelfRaw = oneParam(sp.estante);
  const shelf = (SHELVES.some((s) => s.key === shelfRaw) ? shelfRaw : view === "estanteria" ? "want" : null) as ShelfKey | null;
  const topic = Number(oneParam(sp.tema)) || null;
  const q = oneParam(sp.q).slice(0, 80);
  const page = pageParam(sp.pagina);
  const current = {
    ver: view === "todos" ? undefined : view,
    orden: sort === "recent" ? undefined : sort,
    area: area ?? undefined,
    nivel: level ?? undefined,
    estante: view === "estanteria" && shelf !== "want" ? (shelf ?? undefined) : undefined,
    tema: topic ? String(topic) : undefined,
    q: q || undefined,
  };
  const { items, hasMore } = await listBooks({
    q,
    area,
    level,
    topic,
    sort,
    page,
    shelf: view === "estanteria" ? shelf : null,
    recommendedBy: view === "mias" ? profile.id : null,
  });
  const filtered = Boolean(q || area || level || topic);

  return (
    <>
      <PageHeader
        eyebrow="Comunidad · Biblioteca"
        title="Libros recomendados"
        lead="Lecturas que los miembros recomiendan, con el porqué, el nivel y su valoración. Una ficha por libro; muchas voces."
      >
        {profile.role !== "restricted" && (
          <Link href="/libros/recomendar" className="btn btn-primary">
            <IconPlus size={18} /> Recomendar un libro
          </Link>
        )}
      </PageHeader>

      <NavTabs
        label="Secciones de la biblioteca"
        active={view}
        items={[
          { key: "todos", label: "Todos", href: "/libros" },
          { key: "estanteria", label: "Mi estantería", href: "/libros?ver=estanteria" },
          { key: "mias", label: "Mis recomendaciones", href: "/libros?ver=mias" },
        ]}
      />

      {view === "estanteria" && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {SHELVES.map((s) => (
            <Link
              key={s.key}
              href={hrefWith("/libros", { ver: "estanteria" }, { estante: s.key === "want" ? undefined : s.key })}
              className="chip !min-h-8"
              aria-current={shelf === s.key ? "page" : undefined}
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}

      <form action="/libros" className="mt-6 grid gap-4 sm:grid-cols-[1fr_14rem_11rem_auto] sm:items-end">
        {view !== "todos" && <input type="hidden" name="ver" value={view} />}
        <div>
          <label htmlFor="bq" className="label block">
            Título o autoría
          </label>
          <input id="bq" name="q" defaultValue={q} placeholder="Sagan, permacultura, Egipto…" className="field" />
        </div>
        <div>
          <label htmlFor="barea" className="label block">
            Área
          </label>
          <select id="barea" name="area" defaultValue={area ?? ""} className="field">
            <option value="">Todas</option>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bnivel" className="label block">
            Nivel
          </label>
          <select id="bnivel" name="nivel" defaultValue={level ?? ""} className="field">
            <option value="">Cualquiera</option>
            {BOOK_LEVELS.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-ghost btn-sm">
            Filtrar
          </button>
          {filtered && (
            <Link href={hrefWith("/libros", { ver: current.ver }, {})} className="btn btn-quiet btn-sm">
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <div className="mt-6">
        <NavTabs
          label="Ordenar"
          active={sort}
          items={SORTS.map((s) => ({ key: s.key, label: s.label, href: hrefWith("/libros", current, { orden: s.key === "recent" ? undefined : s.key }) }))}
        />
      </div>

      <div className="mt-8">
        <BookGrid
          books={items}
          empty={
            view === "estanteria" ? (
              "Aún no has guardado libros en esta estantería. Desde la ficha de un libro puedes marcarlo como «Quiero leerlo», «Leyendo» o «Leído»."
            ) : view === "mias" ? (
              <>
                Todavía no has recomendado ningún libro.{" "}
                <Link href="/libros/recomendar" className="link">
                  Recomienda el primero
                </Link>
                .
              </>
            ) : filtered ? (
              "Ningún libro coincide con estos filtros."
            ) : (
              <>
                La biblioteca está vacía.{" "}
                <Link href="/libros/recomendar" className="link">
                  Recomienda el primer libro
                </Link>
                .
              </>
            )
          }
        />
        <Pagination page={page} hasMore={hasMore} hrefFor={(n) => hrefWith("/libros", current, { pagina: n > 1 ? String(n) : undefined })} />
      </div>
    </>
  );
}
