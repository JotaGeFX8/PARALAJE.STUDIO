import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { circleMembers, circleMessages, circleRequests, circleStatus, getCircle } from "@/lib/data/circles";
import { getFeed } from "@/lib/data/posts";
import { coverUrl } from "@/lib/media";
import { VISIBILITY } from "@/lib/content";
import { oneParam, plural, timeAgo } from "@/lib/format";
import { NavTabs } from "@/components/ui/nav-tabs";
import { EmptyState } from "@/components/ui/section";
import { Avatar } from "@/components/ui/avatar";
import { RichText } from "@/components/ui/rich-text";
import { PostList } from "@/components/posts/post-row";
import { GroupChat } from "@/components/groups/group-chat";
import { CircleForm, InviteForm } from "@/components/groups/circle-form";
import { CircleMemberControls, CircleMembershipButton, RequestDecision } from "@/components/groups/group-buttons";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ReportButton } from "@/components/moderation/report-button";
import { deleteCircleAction } from "@/app/(app)/actions/groups";
import { IconLock, IconPlus } from "@/components/ui/icons";

type Props = { params: Promise<{ ref: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCircle((await params).ref);
  return { title: c?.name ?? "Círculo", robots: { index: false } };
}

export default async function CirculoPage({ params, searchParams }: Props) {
  const { profile } = await requireOnboardedMember();
  const { ref } = await params;
  const sp = await searchParams;
  const circle = await getCircle(ref);
  if (!circle) notFound();

  const status = await circleStatus(circle.id, profile.id);
  const isMember = Boolean(status.role);
  const isAdmin = status.role === "owner" || status.role === "admin";
  const isStaff = profile.role === "admin" || profile.role === "moderator";
  const canRead = circle.visibility === "public" || isMember;
  const views = ["conversacion", "chat", "miembros", ...(isAdmin ? ["gestion"] : [])];
  const view = views.includes(oneParam(sp.ver)) ? oneParam(sp.ver) : oneParam(sp.ver) === "solicitudes" && isAdmin ? "gestion" : "conversacion";
  const base = `/circulos/${circle.slug}`;
  const cover = coverUrl(circle.image_path);

  return (
    <div className="max-w-5xl">
      <p className="mb-6 text-sm">
        <Link href="/circulos" className="link-draw text-muted hover:text-accent">
          ← Círculos
        </Link>
      </p>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element -- portada ya reducida
        <img src={cover} alt="" className="mb-8 aspect-[16/6] w-full rounded-xl object-cover" />
      )}
      <header className="flex flex-col gap-6 border-b hairline pb-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="label flex items-center gap-2">
            {circle.visibility !== "public" && <IconLock size={13} />} Círculo {VISIBILITY[circle.visibility].label.toLowerCase()} ·{" "}
            {plural(circle.member_count, "miembro", "miembros")}
          </p>
          <h1 className="display mt-4 text-[clamp(2.2rem,5vw,3.6rem)] text-ink">{circle.name}</h1>
          {circle.description && <RichText text={circle.description} className="prose-doc mt-5" />}
        </div>
        <div className="flex flex-col items-start gap-3">
          <CircleMembershipButton
            circleId={circle.id}
            visibility={circle.visibility}
            role={status.role}
            requestPending={status.requestPending}
            inviteId={status.inviteId}
          />
          {!isMember && <ReportButton targetType="circle" targetId={circle.id} label="Denunciar círculo" />}
        </div>
      </header>

      {canRead ? (
        <>
          <NavTabs
            className="mt-6"
            label="Secciones del círculo"
            active={view}
            items={[
              { key: "conversacion", label: "Conversación", href: base },
              { key: "chat", label: "Chat", href: `${base}?ver=chat` },
              { key: "miembros", label: "Miembros", href: `${base}?ver=miembros` },
              ...(isAdmin ? [{ key: "gestion", label: "Gestión", href: `${base}?ver=gestion` }] : []),
            ]}
          />
          <div className="mt-8">
            {view === "conversacion" && <Conversation circleId={circle.id} isMember={isMember} />}
            {view === "chat" &&
              (isMember ? (
                <GroupChat
                  kind="circle"
                  groupId={circle.id}
                  me={profile.id}
                  initial={await circleMessages(circle.id)}
                  canWrite={profile.role !== "restricted"}
                  canModerate={isAdmin || isStaff}
                  placeholder={`Escribe a ${circle.name}…`}
                  emptyText="El chat está en silencio. Rompe el hielo."
                />
              ) : (
                <EmptyState>El chat es solo para miembros del círculo.</EmptyState>
              ))}
            {view === "miembros" && <Members circleId={circle.id} viewerRole={status.role} />}
            {view === "gestion" && isAdmin && (
              <Manage circle={circle} isOwner={status.role === "owner"} />
            )}
          </div>
        </>
      ) : (
        <EmptyState>
          {circle.visibility === "private"
            ? "Este círculo es privado. Solicita acceso para leer sus conversaciones y participar en su chat."
            : "Este círculo es solo por invitación."}
        </EmptyState>
      )}
    </div>
  );
}

async function Conversation({ circleId, isMember }: { circleId: string; isMember: boolean }) {
  const { items } = await getFeed({ scope: "circle", circle: circleId, limit: 30 });
  return (
    <>
      {isMember && (
        <div className="mb-6 flex justify-end">
          <Link href={`/publicar?circulo=${circleId}`} className="btn btn-primary btn-sm">
            <IconPlus size={16} /> Publicar en el círculo
          </Link>
        </div>
      )}
      <PostList items={items} showCategory={false} empty="Todavía no hay publicaciones en este círculo." />
    </>
  );
}

async function Members({ circleId, viewerRole }: { circleId: string; viewerRole: string | null }) {
  const members = await circleMembers(circleId);
  const ROLE = { owner: "Creador/a", admin: "Administración", member: "" } as const;
  return (
    <ul className="max-w-3xl border-t hairline">
      {members.map((m) => {
        const name = m.person?.display_name ?? m.person?.username ?? "Miembro";
        return (
          <li key={m.user_id} className="flex flex-col gap-2 border-b hairline py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/miembros/${m.person?.username}`} className="flex items-center gap-3">
              <Avatar url={m.person?.avatar_url} name={name} size={40} />
              <span>
                <span className="block text-ink">{name}</span>
                <span className="block text-xs text-muted">
                  {ROLE[m.role] ? `${ROLE[m.role]} · ` : ""}desde {timeAgo(m.joined_at)}
                </span>
              </span>
            </Link>
            {(viewerRole === "owner" || viewerRole === "admin") && (
              <CircleMemberControls
                circleId={circleId}
                memberId={m.user_id}
                role={m.role}
                canPromote={viewerRole === "owner"}
                canRemove={viewerRole === "owner" ? m.role !== "owner" : m.role === "member"}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

async function Manage({ circle, isOwner }: { circle: NonNullable<Awaited<ReturnType<typeof getCircle>>>; isOwner: boolean }) {
  const requests = await circleRequests(circle.id);
  return (
    <div className="grid gap-14">
      <section>
        <h2 className="label mb-3">Solicitudes de acceso</h2>
        {requests.length ? (
          <ul className="max-w-3xl border-t hairline">
            {requests.map((r) => {
              const name = r.person?.display_name ?? r.person?.username ?? "Miembro";
              return (
                <li key={r.id} className="flex flex-col gap-3 border-b hairline py-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link href={`/miembros/${r.person?.username}`} className="flex items-center gap-3">
                    <Avatar url={r.person?.avatar_url} name={name} size={40} />
                    <span>
                      <span className="block text-ink">{name}</span>
                      {r.message && <span className="block text-sm italic text-ink-2">«{r.message}»</span>}
                    </span>
                  </Link>
                  <RequestDecision kind="circle" requestId={r.id} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted">No hay solicitudes pendientes.</p>
        )}
      </section>
      <section className="max-w-md">
        <InviteForm circleId={circle.id} />
      </section>
      <section className="max-w-3xl">
        <h2 className="label mb-5">Ajustes del círculo</h2>
        <CircleForm
          initial={{
            id: circle.id,
            name: circle.name,
            description: circle.description,
            visibility: circle.visibility,
            coverUrl: coverUrl(circle.image_path),
          }}
        />
      </section>
      {isOwner && (
        <section className="max-w-3xl border-t hairline pt-8">
          <h2 className="font-serif text-xl text-danger">Eliminar círculo</h2>
          <p className="mb-4 mt-2 text-sm text-muted">Se borrarán sus publicaciones, su chat y la lista de miembros.</p>
          <ConfirmButton className="btn btn-danger btn-sm" confirmLabel="Eliminar definitivamente" onConfirm={deleteCircleAction.bind(null, circle.id)}>
            Eliminar círculo
          </ConfirmButton>
        </section>
      )}
    </div>
  );
}
