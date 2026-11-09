import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/format";
import type { Enums } from "@/lib/supabase/types";

export type NotificationRow = {
  id: string;
  type: Enums<"notification_type">;
  body: string;
  read_at: string | null;
  created_at: string;
  post_id: string | null;
  comment_id: string | null;
  conversation_id: string | null;
  circle_id: string | null;
  project_id: string | null;
  actor: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
};

function describe(n: NotificationRow, actor: string): { text: React.ReactNode; href: string } {
  const quote = n.body ? <em className="not-italic text-ink">«{n.body}»</em> : null;
  const post = n.post_id ? `/p/${n.post_id}${n.comment_id ? `#c-${n.comment_id}` : ""}` : "/notificaciones";
  switch (n.type) {
    case "comment":
      return { text: <>{actor} comentó en {quote}</>, href: post };
    case "reply":
      return { text: <>{actor} respondió a tu comentario en {quote}</>, href: post };
    case "mention":
      return { text: <>{actor} te mencionó en {quote}</>, href: post };
    case "connection_request":
      return {
        text: (
          <>
            {actor} quiere conectar contigo{n.body ? <>: {quote}</> : null}
          </>
        ),
        href: "/conexiones?ver=solicitudes",
      };
    case "connection_accepted":
      return { text: <>{actor} aceptó tu solicitud de conexión</>, href: `/miembros/${n.actor?.username ?? ""}` };
    case "message":
      return { text: <>{actor} te ha escrito: {quote}</>, href: `/mensajes/${n.conversation_id}` };
    case "circle_invite":
      return { text: <>{actor} te invita al círculo {quote}</>, href: `/circulos/${n.circle_id}` };
    case "circle_request":
      return { text: <>{actor} pide unirse a {quote}</>, href: `/circulos/${n.circle_id}?ver=solicitudes` };
    case "circle_approved":
      return { text: <>Ya formas parte del círculo {quote}</>, href: `/circulos/${n.circle_id}` };
    case "project_request":
      return { text: <>{actor} quiere colaborar en {quote}</>, href: `/proyectos/${n.project_id}?ver=solicitudes` };
    case "project_approved":
      return { text: <>Te han aceptado en el proyecto {quote}</>, href: `/proyectos/${n.project_id}` };
    case "project_update":
      return { text: <>Novedades en el proyecto {quote}</>, href: `/proyectos/${n.project_id}` };
    case "moderation":
    default:
      return { text: <>{n.body || "Aviso del equipo de moderación"}</>, href: "/notificaciones" };
  }
}

export function NotificationItem({ n, unread }: { n: NotificationRow; unread: boolean }) {
  const actor = n.actor?.display_name ?? n.actor?.username ?? "Alguien";
  const { text, href } = describe(n, actor);
  return (
    <li>
      <Link
        href={href}
        className={`flex gap-4 border-b hairline px-2 py-4 transition-colors hover:bg-surface-2 ${unread ? "bg-accent-faint" : ""}`}
      >
        <span className="relative shrink-0">
          <Avatar url={n.actor?.avatar_url} name={actor} size={40} />
          {unread && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-canvas" aria-label="Nuevo" />}
        </span>
        <span className="min-w-0">
          <span className="block text-[0.9375rem] leading-snug text-ink-2">{text}</span>
          <time dateTime={n.created_at} className="mt-1 block text-xs text-muted">
            {timeAgo(n.created_at)}
          </time>
        </span>
      </Link>
    </li>
  );
}
