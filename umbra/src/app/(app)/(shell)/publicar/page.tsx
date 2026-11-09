import type { Metadata } from "next";
import { requireOnboardedMember } from "@/lib/auth";
import { getCategories } from "@/lib/data/posts";
import { PageHeader } from "@/components/ui/page-header";
import { Composer } from "@/components/posts/composer";
import { oneParam } from "@/lib/format";

export const metadata: Metadata = { title: "Publicar" };

export default async function PublicarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireOnboardedMember();
  const sp = await searchParams;
  const categories = await getCategories();
  const territorio = oneParam(sp.territorio);
  const initialCategory = categories.some((c) => c.slug === territorio) ? territorio : "";

  if (profile.role === "restricted") {
    return (
      <div className="max-w-2xl">
        <PageHeader eyebrow="Publicar" title="Publicación restringida" lead="Tu cuenta puede leer y reaccionar, pero no publicar por ahora. Si crees que es un error, contacta con el equipo de moderación." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Nueva publicación" title="Comparte algo" lead="Una idea, un hallazgo, una pregunta o una experiencia. Lo que aportes, decláralo con honestidad." />
      <Composer mode="create" categories={categories} initial={{ category: initialCategory }} />
    </div>
  );
}
