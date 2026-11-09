import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { searchPosts, searchTags } from "@/lib/data/posts";
import { searchMembersByName } from "@/lib/data/members";
import { PageHeader } from "@/components/ui/page-header";
import { PostList } from "@/components/posts/post-row";
import { MemberRow } from "@/components/profile/member-row";
import { NavTabs, Pagination, hrefWith } from "@/components/ui/nav-tabs";
import { EmptyState } from "@/components/ui/section";
import { IconSearch } from "@/components/ui/icons";
import { oneParam, pageParam } from "@/lib/format";
import { discoverCircles } from "@/lib/data/circles";
import { listProjects } from "@/lib/data/projects";
import { CircleCard, ProjectCard } from "@/components/groups/cards";
import { listBooks } from "@/lib/data/books";
import { BookGrid } from "@/components/books/book-grid";

export const metadata: Metadata = { title: "Buscar" };

const TABS = [
  { key: "publicaciones", label: "Publicaciones" },
  { key: "personas", label: "Personas" },
  { key: "circulos", label: "Círculos" },
  { key: "proyectos", label: "Proyectos" },
  { key: "libros", label: "Libros" },
  { key: "etiquetas", label: "Etiquetas" },
] as const;

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireOnboardedMember();
  const sp = await searchParams;
  const q = oneParam(sp.q).trim().slice(0, 120);
  const tabParam = oneParam(sp.en);
  const tab = TABS.some((t) => t.key === tabParam) ? tabParam : "publicaciones";
  const page = pageParam(sp.pagina);

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Buscar" title="¿Qué estás buscando?" />
      <form action="/buscar" role="search" className="boxed mb-8 flex items-center gap-3 px-4">
        <IconSearch size={20} className="shrink-0 text-muted" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Física cuántica, adobe, Göbekli Tepe, @usuario…"
          aria-label="Buscar"
          className="min-h-14 w-full bg-transparent text-lg outline-none"
        />
        {tab !== "publicaciones" && <input type="hidden" name="en" value={tab} />}
        <button type="submit" className="btn btn-primary btn-sm">
          Buscar
        </button>
      </form>

      {q ? (
        <>
          <NavTabs
            label="Resultados"
            active={tab}
            items={TABS.map((t) => ({ key: t.key, label: t.label, href: hrefWith("/buscar", { q }, { en: t.key === "publicaciones" ? undefined : t.key }) }))}
          />
          <div className="mt-6">
            <Results tab={tab} q={q} page={page} userId={profile.id} />
          </div>
        </>
      ) : (
        <EmptyState>Busca en publicaciones, personas, círculos, proyectos y etiquetas. La búsqueda de publicaciones ignora tildes y encuentra palabras incompletas.</EmptyState>
      )}
    </div>
  );
}

async function Results({ tab, q, page, userId }: { tab: string; q: string; page: number; userId: string }) {
  if (tab === "personas") {
    const members = await searchMembersByName(q.replace(/^@/, ""));
    return members.length ? (
      <ul className="border-t hairline">{members.map((m) => <MemberRow key={m.id} m={m} />)}</ul>
    ) : (
      <EmptyState>Ningún miembro coincide con «{q}».</EmptyState>
    );
  }
  if (tab === "circulos") {
    const circles = await discoverCircles(userId, q);
    return circles.length ? (
      <ul className="grid gap-x-8 gap-y-10 border-t hairline pt-6 sm:grid-cols-2">
        {circles.map((c) => (
          <CircleCard key={c.id} c={c} note={c.joined ? "Eres miembro" : undefined} />
        ))}
      </ul>
    ) : (
      <EmptyState>Ningún círculo coincide con «{q}».</EmptyState>
    );
  }
  if (tab === "proyectos") {
    const projects = await listProjects({ q }, "active", 30);
    return projects.length ? (
      <ul className="grid gap-x-8 gap-y-10 border-t hairline pt-6 sm:grid-cols-2">
        {projects.map((p) => (
          <ProjectCard key={p.id} p={p} />
        ))}
      </ul>
    ) : (
      <EmptyState>Ningún proyecto coincide con «{q}».</EmptyState>
    );
  }
  if (tab === "libros") {
    const { items } = await listBooks({ q }, 24);
    return items.length ? (
      <div className="border-t hairline pt-6">
        <BookGrid books={items} empty={null} />
      </div>
    ) : (
      <EmptyState>Ningún libro coincide con «{q}».</EmptyState>
    );
  }
  if (tab === "etiquetas") {
    const tags = await searchTags(q.replace(/^#/, ""));
    return tags.length ? (
      <div className="flex flex-wrap gap-2 border-t hairline pt-6">
        {tags.map((t) => (
          <Link key={t.slug} href={`/etiqueta/${t.slug}`} className="tag !min-h-9 !px-3.5 !text-sm">
            #{t.slug}
          </Link>
        ))}
      </div>
    ) : (
      <EmptyState>Ninguna etiqueta coincide con «{q}».</EmptyState>
    );
  }
  const { items, hasMore } = await searchPosts(q, page);
  return (
    <>
      <PostList items={items} empty={<>No hay publicaciones que coincidan con «{q}».</>} />
      <Pagination page={page} hasMore={hasMore} hrefFor={(n) => hrefWith("/buscar", { q }, { pagina: n > 1 ? String(n) : undefined })} />
    </>
  );
}
