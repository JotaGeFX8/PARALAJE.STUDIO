import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { myNotifications } from "@/lib/data/social";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/section";
import { NotificationItem, type NotificationRow } from "@/components/notifications/notification-item";

export const metadata: Metadata = { title: "Notificaciones" };

export default async function NotificacionesPage() {
  const { profile } = await requireOnboardedMember();
  const items = (await myNotifications(80)) as NotificationRow[];
  const unreadIds = items.filter((n) => !n.read_at && n.type !== "message").map((n) => n.id);
  // Al abrir el centro de avisos, quedan leídos (los mensajes se marcan al abrir la conversación).
  if (unreadIds.length) {
    const supabase = await createClient();
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", unreadIds).eq("user_id", profile.id);
  }
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Actividad" title="Notificaciones">
        <Link href="/ajustes#avisos" className="btn btn-ghost btn-sm">
          Preferencias
        </Link>
      </PageHeader>
      {items.length ? (
        <ul className="border-t hairline">
          {items.map((n) => (
            <NotificationItem key={n.id} n={n} unread={!n.read_at} />
          ))}
        </ul>
      ) : (
        <EmptyState>
          Aquí verás comentarios y respuestas, menciones, solicitudes de conexión, mensajes y la actividad de tus círculos
          y proyectos.
        </EmptyState>
      )}
    </div>
  );
}
