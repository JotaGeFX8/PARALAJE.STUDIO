import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { getFeed } from "@/lib/data/posts";
import { PageHeader } from "@/components/ui/page-header";
import { PostList } from "@/components/posts/post-row";
import { Pagination } from "@/components/ui/nav-tabs";
import { pageParam } from "@/lib/format";

export const metadata: Metadata = { title: "Guardados" };

export default async function GuardadosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireOnboardedMember();
  const page = pageParam((await searchParams).pagina);
  const { items, hasMore } = await getFeed({ scope: "all", savedOnly: true, page });
  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Tu biblioteca" title="Guardados" lead="Las publicaciones que has guardado para volver a ellas." />
      <PostList
        items={items}
        empty={
          <>
            Aún no has guardado nada. Usa «Guardar» en cualquier publicación.{" "}
            <Link href="/explorar" className="link">
              Explorar
            </Link>
          </>
        }
      />
      <Pagination page={page} hasMore={hasMore} hrefFor={(n) => (n > 1 ? `/guardados?pagina=${n}` : "/guardados")} />
    </div>
  );
}
