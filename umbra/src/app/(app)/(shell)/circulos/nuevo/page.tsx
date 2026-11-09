import type { Metadata } from "next";
import { requireOnboardedMember } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { CircleForm } from "@/components/groups/circle-form";

export const metadata: Metadata = { title: "Crear círculo" };

export default async function NuevoCirculoPage() {
  const { profile } = await requireOnboardedMember();
  if (profile.role === "restricted") {
    return <PageHeader eyebrow="Círculos" title="Creación restringida" lead="Tu cuenta no puede crear círculos por ahora." />;
  }
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Nuevo círculo" title="Reúne a tu gente" lead="Un grupo para conversar a fondo sobre un tema, con su propio chat y sus publicaciones." />
      <CircleForm />
    </div>
  );
}
