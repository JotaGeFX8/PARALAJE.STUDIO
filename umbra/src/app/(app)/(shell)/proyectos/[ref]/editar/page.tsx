import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getProject } from "@/lib/data/projects";
import { createClient } from "@/lib/supabase/server";
import { coverUrl } from "@/lib/media";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectForm } from "@/components/groups/project-form";

export const metadata: Metadata = { title: "Editar proyecto" };

export default async function EditarProyectoPage({ params }: { params: Promise<{ ref: string }> }) {
  const { profile } = await requireOnboardedMember();
  const project = await getProject((await params).ref);
  if (!project) notFound();
  if (project.owner_id !== profile.id) redirect(`/proyectos/${project.slug}`);
  const supabase = await createClient();
  const { data: interests } = await supabase.from("interests").select("slug, name").order("position");
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Proyecto" title="Editar proyecto" />
      <ProjectForm
        interests={interests ?? []}
        initial={{ ...project, coverUrl: coverUrl(project.cover_path) }}
      />
    </div>
  );
}
