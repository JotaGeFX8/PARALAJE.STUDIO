import type { Metadata } from "next";
import { requireOnboardedMember } from "@/lib/auth";
import { getCatalog } from "@/lib/data/catalog";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectForm } from "@/components/groups/project-form";

export const metadata: Metadata = { title: "Publicar proyecto" };

export default async function NuevoProyectoPage() {
  const { profile } = await requireOnboardedMember();
  if (profile.role === "restricted") {
    return <PageHeader eyebrow="Proyectos" title="Creación restringida" lead="Tu cuenta no puede publicar proyectos por ahora." />;
  }
  const catalog = await getCatalog();
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Nuevo proyecto" title="De la idea a la obra" lead="Cuenta qué queréis construir, investigar u organizar y qué ayuda buscáis." />
      <ProjectForm catalog={catalog} />
    </div>
  );
}
