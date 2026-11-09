import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { getFeed } from "@/lib/data/posts";
import { PageHeader } from "@/components/ui/page-header";
import { NavTabs, Pagination, hrefWith } from "@/components/ui/nav-tabs";
import { PostList } from "@/components/posts/post-row";
import { QuickPost } from "@/components/posts/quick-post";
import { AREAS, SORTS, parseSort } from "@/lib/content";
import { oneParam, pageParam } from "@/lib/format";

export const metadata: Metadata = { title: "Ágora" };

export default async function AgoraPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { profile } = await requireOnboardedMember();
  const sp = await searchParams;
  const sort = parseSort(oneParam(sp.orden));
  const questions = oneParam(sp.preguntas) === "1";
  const page = pageParam(sp.pagina);
  const current = { orden: sort === "recent" ? undefined : sort, preguntas: questions ? "1" : undefined };
  const { items, hasMore } = await getFeed({ scope: "agora", sort, page, questionsOnly: questions });
  const first = (profile.display_name ?? profile.username ?? "").split(" ")[0];

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="La plaza" title="Ágora" lead={AREAS[5].description} />
      {profile.role !== "restricted" && (
        <div className="mb-10">
          <QuickPost name={first} />
        </div>
      )}
      <NavTabs
        label="Ordenar"
        active={sort}
        items={SORTS.map((s) => ({ key: s.key, label: s.label, short: s.short, href: hrefWith("/agora", current, { orden: s.key === "recent" ? undefined : s.key }) }))}
      />
      <div className="mt-4 flex gap-2">
        <Link href={hrefWith("/agora", current, { preguntas: undefined })} className="chip !min-h-8" aria-current={!questions ? "page" : undefined}>
          Todo
        </Link>
        <Link href={hrefWith("/agora", current, { preguntas: "1" })} className="chip !min-h-8" aria-current={questions ? "page" : undefined}>
          Solo preguntas
        </Link>
      </div>
      <div className="mt-4">
        <PostList
          items={items}
          showCategory={false}
          empty={questions ? "Nadie ha lanzado preguntas todavía." : "La plaza está en calma. Sé la primera voz."}
        />
        <Pagination page={page} hasMore={hasMore} hrefFor={(n) => hrefWith("/agora", current, { pagina: n > 1 ? String(n) : undefined })} />
      </div>
    </div>
  );
}
