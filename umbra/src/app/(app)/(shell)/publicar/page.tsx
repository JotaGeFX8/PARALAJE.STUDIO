import type { Metadata } from "next";
import { requireOnboardedMember } from "@/lib/auth";
import { getForums } from "@/lib/data/posts";
import { PageHeader } from "@/components/ui/page-header";
import { Composer } from "@/components/posts/composer";
import { oneParam } from "@/lib/format";
import { circleStatus, getCircle } from "@/lib/data/circles";

export const metadata: Metadata = { title: "Publicar" };

export default async function PublicarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireOnboardedMember();
  const sp = await searchParams;
  const forums = await getForums();
  // ?foro=…&sub=… (y la dirección antigua ?territorio=…, que es una subcategoría)
  const subParam = oneParam(sp.sub) || oneParam(sp.territorio);
  const fromSub = forums.find((f) => f.categories.some((c) => c.slug === subParam));
  const forum = forums.find((f) => f.slug === oneParam(sp.foro)) ?? fromSub ?? forums.find((f) => f.slug === "agora");
  const initialCategory = forum?.categories.some((c) => c.slug === subParam) ? subParam : "";

  if (profile.role === "restricted") {
    return (
      <div className="max-w-2xl">
        <PageHeader eyebrow="Publicar" title="Publicación restringida" lead="Tu cuenta puede leer y reaccionar, pero no publicar por ahora. Si crees que es un error, contacta con el equipo de moderación." />
      </div>
    );
  }

  const circleRef = oneParam(sp.circulo);
  if (circleRef) {
    const circle = await getCircle(circleRef);
    const status = circle ? await circleStatus(circle.id, profile.id) : null;
    if (!circle || !status?.role) {
      return <PageHeader eyebrow="Publicar" title="No puedes publicar aquí" lead="Solo los miembros de un círculo pueden publicar en él." />;
    }
    return (
      <div className="max-w-3xl">
        <PageHeader eyebrow={`Círculo · ${circle.name}`} title="Publicar en el círculo" lead="Lo verán los miembros del círculo (y, si es público, cualquier miembro de la comunidad)." />
        <Composer mode="create" userId={profile.id} circle={circle.id} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Nueva publicación" title="Comparte algo" lead="Un debate, una pregunta, una investigación, un recurso o una encuesta. Lo que aportes, clasifícalo con honestidad." />
      {forum?.rules && (
        <details className="mb-8 rounded-sm bg-surface-2 p-4 text-sm text-ink-2">
          <summary className="cursor-pointer font-medium text-ink">Normas de {forum.name}</summary>
          <p className="mt-2 whitespace-pre-line leading-relaxed">{forum.rules}</p>
        </details>
      )}
      <Composer mode="create" userId={profile.id} forums={forums} initial={{ forum: forum?.slug ?? "agora", category: initialCategory }} />
    </div>
  );
}
