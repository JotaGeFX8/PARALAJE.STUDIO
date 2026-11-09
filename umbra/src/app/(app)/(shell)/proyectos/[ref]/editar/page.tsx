import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getProject, projectTopics } from "@/lib/data/projects";
import { getCatalog } from "@/lib/data/catalog";
import { coverUrl } from "@/lib/media";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectForm } from "@/components/groups/project-form";

export const metadata: Metadata = { title: "Editar proyecto" };

export default async function EditarProyectoPage({ params }: { params: Promise<{ ref: string }> }) {
  const { profile } = await requireOnboardedMember();
  const project = await getProject((await params).ref);
  if (!project) notFound();
  if (project.owner_id !== profile.id) redirect(`/proyectos/${project.slug}`);
  const [catalog, topics] = await Promise.all([getCatalog(), projectTopics(project.id)]);
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Proyecto" title="Editar proyecto" />
      <ProjectForm
        catalog={catalog}
        initial={{
          ...project,
          topics: topics.themes.map((t) => t.id),
          skills: topics.skills.map((t) => t.id),
          coverUrl: coverUrl(project.cover_path),
        }}
      />
    </div>
  );
}
