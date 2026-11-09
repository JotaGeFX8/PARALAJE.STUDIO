import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getProject, projectMessages, projectParticipants, projectRequests, projectStatusFor, projectTopics } from "@/lib/data/projects";
import { getAreas } from "@/lib/data/catalog";
import { coverUrl } from "@/lib/media";
import { formatDate, plural, timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { RichText } from "@/components/ui/rich-text";
import { StatusBadge } from "@/components/groups/cards";
import { GroupChat } from "@/components/groups/group-chat";
import { ProjectMemberRemove, ProjectMembershipButton, RequestDecision } from "@/components/groups/group-buttons";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ReportButton } from "@/components/moderation/report-button";
import { ShareButton } from "@/components/ui/share-button";
import { deleteProjectAction } from "@/app/(app)/actions/groups";
import { IconCheck, IconEdit } from "@/components/ui/icons";

type Props = { params: Promise<{ ref: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProject((await params).ref);
  return { title: p?.title ?? "Proyecto", robots: { index: false } };
}

export default async function ProyectoPage({ params }: Props) {
  const { profile } = await requireOnboardedMember();
  const project = await getProject((await params).ref);
  if (!project) notFound();

  const [status, participants, messages, topics, areas] = await Promise.all([
    projectStatusFor(project.id, profile.id),
    projectParticipants(project.id),
    projectMessages(project.id),
    projectTopics(project.id),
    getAreas(),
  ]);
  const area = areas.find((a) => a.slug === project.area_slug);
  const isOwner = project.owner_id === profile.id;
  const isStaff = profile.role === "admin" || profile.role === "moderator";
  const requests = isOwner ? await projectRequests(project.id) : [];
  const place = [project.region, project.country].filter(Boolean).join(", ");
  const cover = coverUrl(project.cover_path);
  const owner = participants.find((p) => p.role === "owner");

  return (
    <article className="max-w-5xl">
      <p className="mb-6 text-sm">
        <Link href="/proyectos" className="link-draw text-muted hover:text-accent">
          ← Proyectos
        </Link>
      </p>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element -- portada ya reducida
        <img src={cover} alt="" className="mb-8 aspect-[16/7] w-full rounded-sm object-cover" />
      )}

      <header className="border-b hairline pb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <StatusBadge status={project.status} />
          {place && <span>{place}</span>}
          <span>· {plural(project.participant_count, "participante", "participantes")}</span>
          <span>· actualizado {timeAgo(project.updated_at)}</span>
        </div>
        <h1 className="display mt-4 text-[clamp(2.2rem,5vw,3.6rem)] text-ink">{project.title}</h1>
        {project.summary && <p className="mt-4 max-w-2xl font-serif text-xl leading-relaxed text-ink-2">{project.summary}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ProjectMembershipButton projectId={project.id} role={status.role} request={status.request} />
          {isOwner && (
            <Link href={`/proyectos/${project.slug}/editar`} className="btn btn-ghost btn-sm">
              <IconEdit size={16} /> Editar
            </Link>
          )}
          <ShareButton path={`/proyectos/${project.slug}`} title={project.title} />
          {!isOwner && <ReportButton targetType="project" targetId={project.id} label="Denunciar" />}
        </div>
      </header>

      <div className="grid gap-12 pt-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <div className="space-y-12">
          {project.description && (
            <section>
              <h2 className="label mb-4">El proyecto</h2>
              <RichText text={project.description} />
            </section>
          )}
          {project.objectives.length > 0 && (
            <section>
              <h2 className="label mb-4">Objetivos</h2>
              <ul className="space-y-3">
                {project.objectives.map((o, i) => (
                  <li key={i} className="flex gap-3 text-[1.0625rem] leading-relaxed text-ink-2">
                    <IconCheck size={20} className="mt-1 shrink-0 text-accent" />
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {project.seeking && (
            <section className="rounded-sm bg-surface-2 p-6">
              <h2 className="label mb-3">Qué ayuda buscan</h2>
              <p className="font-serif text-lg leading-relaxed text-ink">{project.seeking}</p>
            </section>
          )}

          <section aria-labelledby="conversacion">
            <h2 id="conversacion" className="font-serif text-2xl text-ink">
              Conversación
            </h2>
            <p className="mb-6 mt-1 text-sm text-muted">
              Abierta a todos los miembros: preguntas, ideas y ofrecimientos. Quienes participan pueden publicar novedades.
            </p>
            <GroupChat
              kind="project"
              groupId={project.id}
              me={profile.id}
              initial={messages}
              canWrite={profile.role !== "restricted"}
              canPostUpdate={Boolean(status.role)}
              canModerate={isOwner || isStaff}
              placeholder="Pregunta, propone u ofrece ayuda…"
              emptyText="Nadie ha escrito todavía. ¿Tienes una pregunta o algo que ofrecer?"
            />
          </section>
        </div>

        <aside className="space-y-10">
          {area && (
            <div>
              <h2 className="label mb-3">Área</h2>
              <Link href={`/proyectos?area=${area.slug}`} className="tag">
                {area.name}
              </Link>
            </div>
          )}
          {topics.themes.length > 0 && (
            <div>
              <h2 className="label mb-3">Temáticas</h2>
              <div className="flex flex-wrap gap-1.5">
                {topics.themes.map((t) => (
                  <Link key={t.id} href={`/proyectos?tema=${t.id}`} className="tag">
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {topics.skills.length > 0 && (
            <div>
              <h2 className="label mb-3">Conocimientos que necesitan</h2>
              <div className="flex flex-wrap gap-1.5">
                {topics.skills.map((t) => (
                  <Link key={t.id} href={`/conexiones?ver=buscar&t=${t.id}&rel=can_teach`} className="tag" title="Buscar personas que puedan ayudar">
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div>
            <h2 className="label mb-3">Participantes</h2>
            <ul className="space-y-3">
              {participants.map((p) => {
                const name = p.person?.display_name ?? p.person?.username ?? "Miembro";
                return (
                  <li key={p.user_id} className="flex items-center justify-between gap-3">
                    <Link href={`/miembros/${p.person?.username}`} className="flex items-center gap-3 hover:text-accent">
                      <Avatar url={p.person?.avatar_url} name={name} size={36} />
                      <span>
                        <span className="block text-[0.9375rem] text-ink">{name}</span>
                        <span className="block text-xs text-muted">{p.role === "owner" ? "Impulsa el proyecto" : `Desde ${formatDate(p.joined_at)}`}</span>
                      </span>
                    </Link>
                    {isOwner && p.role !== "owner" && <ProjectMemberRemove projectId={project.id} memberId={p.user_id} />}
                  </li>
                );
              })}
            </ul>
          </div>
          {isOwner && (
            <div id="solicitudes">
              <h2 className="label mb-3">Solicitudes de colaboración</h2>
              {requests.length ? (
                <ul className="space-y-5">
                  {requests.map((r) => {
                    const name = r.person?.display_name ?? r.person?.username ?? "Miembro";
                    return (
                      <li key={r.id} className="rounded-sm border border-line-2 p-4">
                        <Link href={`/miembros/${r.person?.username}`} className="flex items-center gap-3">
                          <Avatar url={r.person?.avatar_url} name={name} size={32} />
                          <span className="text-ink">{name}</span>
                        </Link>
                        {r.message && <p className="mt-2 text-sm italic leading-relaxed text-ink-2">«{r.message}»</p>}
                        <div className="mt-3">
                          <RequestDecision kind="project" requestId={r.id} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted">No hay solicitudes pendientes.</p>
              )}
            </div>
          )}
          {owner && !isOwner && (
            <p className="text-sm text-muted">
              Publicado por{" "}
              <Link href={`/miembros/${owner.person?.username}`} className="link">
                {owner.person?.display_name ?? owner.person?.username}
              </Link>{" "}
              el {formatDate(project.created_at)}.
            </p>
          )}
          {isOwner && (
            <div className="border-t hairline pt-6">
              <ConfirmButton className="btn btn-danger btn-sm" confirmLabel="Eliminar definitivamente" onConfirm={deleteProjectAction.bind(null, project.id)}>
                Eliminar proyecto
              </ConfirmButton>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
