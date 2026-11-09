import type { Metadata } from "next";
import { requireOnboardedMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectForm } from "@/components/groups/project-form";

export const metadata: Metadata = { title: "Publicar proyecto" };

export default async function NuevoProyectoPage() {
  const { profile } = await requireOnboardedMember();
  if (profile.role === "restricted") {
    return <PageHeader eyebrow="Proyectos" title="Creación restringida" lead="Tu cuenta no puede publicar proyectos por ahora." />;
  }
  const supabase = await createClient();
  const { data: interests } = await supabase.from("interests").select("slug, name").order("position");
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Nuevo proyecto" title="De la idea a la obra" lead="Cuenta qué queréis construir, investigar u organizar y qué ayuda buscáis." />
      <ProjectForm interests={interests ?? []} />
    </div>
  );
}
