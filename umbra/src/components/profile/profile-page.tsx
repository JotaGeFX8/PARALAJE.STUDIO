import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { NavTabs } from "@/components/ui/nav-tabs";
import { PhotoGrid } from "@/components/feed/photo-grid";
import { PostList } from "@/components/posts/post-row";
import { BookGrid } from "@/components/books/book-grid";
import { ProfileView } from "./profile-view";
import { followStats, profilePhotos } from "@/lib/data/feed";
import { getFeed } from "@/lib/data/posts";
import { listBooks } from "@/lib/data/books";
import { AVAILABILITY_LABELS, type PrivacySectionKey, type VisibilityKey } from "@/lib/content";
import type { MemberProfile } from "@/lib/data/members";

const TABS = [
  { key: "fotos", label: "Fotos" },
  { key: "publicaciones", label: "Publicaciones" },
  { key: "libros", label: "Libros" },
  { key: "acerca", label: "Acerca de" },
] as const;
export type ProfileTab = (typeof TABS)[number]["key"];
export const parseProfileTab = (v: string): ProfileTab => (TABS.some((t) => t.key === v) ? (v as ProfileTab) : "fotos");

function Stat({ n, label, href }: { n: number; label: string; href?: string }) {
  const body = (
    <>
      <span className="block text-lg font-semibold leading-tight text-ink tabular-nums">{n.toLocaleString("es")}</span>
      <span className="block text-xs text-muted">{label}</span>
    </>
  );
  return href ? (
    <Link href={href} className="text-center hover:opacity-80 sm:text-left">
      {body}
    </Link>
  ) : (
    <span className="text-center sm:text-left">{body}</span>
  );
}

/**
 * Perfil al estilo de una red social: cabecera con contadores y acciones,
 * y pestañas (fotos, publicaciones, libros y la información detallada).
 */
export async function ProfilePage({
  p,
  base,
  tab,
  own,
  actions,
  footer,
  shared,
  reasons,
  privacy,
}: {
  p: MemberProfile;
  base: string;
  tab: ProfileTab;
  own: boolean;
  actions: React.ReactNode;
  footer?: React.ReactNode;
  shared?: string[];
  reasons?: string[];
  privacy?: Record<PrivacySectionKey, VisibilityKey>;
}) {
  const stats = await followStats(p.id);
  const canSeeActivity = own || p.visible.activity;
  const place = [p.region, p.country].filter(Boolean).join(", ");
  const name = p.display_name || p.username;

  let content: React.ReactNode;
  if (tab === "acerca") {
    content = <ProfileView p={p} bare own={own} privacy={privacy} shared={shared} reasons={reasons} footer={footer} />;
  } else if (!canSeeActivity) {
    content = <p className="py-12 text-center text-[0.9375rem] text-muted">Esta persona solo muestra su actividad a sus conexiones.</p>;
  } else if (tab === "fotos") {
    const photos = await profilePhotos(p.id);
    content = (
      <PhotoGrid
        photos={photos}
        empty={
          own ? (
            <>
              Aún no has compartido fotos.{" "}
              <Link href="/crear/foto" className="link">
                Publica la primera
              </Link>
              .
            </>
          ) : (
            "Todavía no ha compartido fotos."
          )
        }
      />
    );
  } else if (tab === "publicaciones") {
    const { items } = await getFeed({ scope: "all", author: p.id, limit: 20 });
    content = <PostList items={items} empty={own ? "Aún no has publicado nada." : "Todavía no ha publicado nada."} />;
  } else {
    const { items } = await listBooks({ recommendedBy: p.id }, 24);
    content = <BookGrid books={items} empty={own ? "Aún no has recomendado libros." : "Todavía no ha recomendado libros."} />;
  }

  return (
    <article className="mx-auto max-w-4xl">
      {p.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element -- imagen servida desde /media
        <img src={p.cover_url} alt="" className="mb-5 aspect-[3/1] w-full rounded-2xl object-cover max-sm:-mx-5 max-sm:w-[calc(100%+2.5rem)] max-sm:max-w-none max-sm:rounded-none sm:aspect-[4/1]" />
      )}
      <header className="pb-6">
        <div className="flex items-center gap-5 sm:gap-10">
          <div className={p.cover_url ? "-mt-14 rounded-full ring-4 ring-canvas sm:-mt-20" : ""}>
            <Avatar url={p.avatar_url} name={name} size={p.cover_url ? 96 : 88} className="sm:!h-[8.5rem] sm:!w-[8.5rem]" />
          </div>
          <div className="flex flex-1 justify-around gap-2 sm:justify-start sm:gap-10">
            <Stat n={stats.posts} label="publicaciones" />
            <Stat n={stats.followers} label="seguidores" href={`${base}/seguidores`} />
            <Stat n={stats.following} label="seguidos" href={`${base}/seguidos`} />
          </div>
        </div>
        <div className="mt-4">
          <h1 className="text-xl font-semibold text-ink">{name}</h1>
          <p className="text-sm text-muted">
            @{p.username}
            {stats.followsMe && !own && <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink-2">Te sigue</span>}
          </p>
          {p.bio && <p className="mt-2 line-clamp-4 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink-2">{p.bio}</p>}
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
            {place && <span>{place}</span>}
            <span className={p.availability === "open" ? "text-accent" : ""}>{AVAILABILITY_LABELS[p.availability]}</span>
            {p.connections_count !== null && (
              <span>
                {p.connections_count} {p.connections_count === 1 ? "conexión" : "conexiones"}
              </span>
            )}
          </p>
          {p.topics.filter((t) => t.is_primary).length > 0 && (
            <p className="mt-3 flex flex-wrap gap-1.5">
              {p.topics
                .filter((t) => t.is_primary)
                .map((t) => (
                  <span key={t.topic_id} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-accent-strong">
                    {t.name}
                  </span>
                ))}
            </p>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>
      </header>

      <NavTabs
        label="Secciones del perfil"
        active={tab}
        className="justify-around sm:justify-start"
        items={TABS.map((t) => ({ key: t.key, label: t.label, href: t.key === "fotos" ? base : `${base}?ver=${t.key}` }))}
      />
      <div className="mt-5">{content}</div>
    </article>
  );
}
