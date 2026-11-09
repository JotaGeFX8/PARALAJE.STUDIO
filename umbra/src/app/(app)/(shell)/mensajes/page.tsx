import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { myConversations } from "@/lib/data/social";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/section";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo, truncate } from "@/lib/format";

export const metadata: Metadata = { title: "Mensajes" };

export default async function MensajesPage() {
  const { profile } = await requireOnboardedMember();
  const conversations = await myConversations();
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Privado" title="Mensajes" lead="Conversaciones con tus conexiones. Solo las ven quienes participan." />
      {conversations.length ? (
        <ul className="border-t hairline">
          {conversations.map((c) => {
            const unread = Number(c.unread) > 0;
            return (
              <li key={c.id}>
                <Link href={`/mensajes/${c.id}`} className={`flex items-center gap-4 border-b hairline px-2 py-4 transition-colors hover:bg-surface-2 ${unread ? "bg-accent-faint" : ""}`}>
                  <Avatar url={c.other_avatar} name={c.other_name} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={`truncate font-serif text-lg ${unread ? "text-ink" : "text-ink-2"}`}>{c.other_name}</span>
                      <time dateTime={c.last_message_at} className="shrink-0 text-xs text-muted">
                        {timeAgo(c.last_message_at)}
                      </time>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-3">
                      <span className={`truncate text-sm ${unread ? "font-medium text-ink" : "text-muted"}`}>
                        {c.last_body ? `${c.last_sender === profile.id ? "Tú: " : ""}${truncate(c.last_body, 90)}` : "Conversación nueva"}
                      </span>
                      {unread && <span className="badge shrink-0">{Number(c.unread)}</span>}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState action={<Link href="/conexiones?ver=red" className="btn btn-ghost">Ver mis conexiones</Link>}>
          Aún no tienes conversaciones. Puedes escribir a cualquier persona con la que estés conectada.
        </EmptyState>
      )}
    </div>
  );
}
