import type { Metadata } from "next";
import { requireOnboardedMember } from "@/lib/auth";
import { getAreas } from "@/lib/data/catalog";
import { getForums } from "@/lib/data/posts";
import { PageHeader } from "@/components/ui/page-header";
import { PhotoComposer } from "@/components/feed/photo-composer";

export const metadata: Metadata = { title: "Publicar fotos" };

export default async function FotoPage() {
  const { profile } = await requireOnboardedMember();
  if (profile.role === "restricted") {
    return <PageHeader eyebrow="Crear" title="Publicación restringida" lead="Tu cuenta puede ver y reaccionar, pero no publicar por ahora." />;
  }
  const [areas, forums] = await Promise.all([getAreas(), getForums()]);
  return (
    <div className="max-w-5xl">
      <PageHeader eyebrow="Crear" title="Publicar fotos" />
      <PhotoComposer userId={profile.id} areas={areas} forums={forums.map((f) => ({ slug: f.slug, name: f.name }))} />
    </div>
  );
}
