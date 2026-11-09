import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getConversation } from "@/lib/data/social";
import { Avatar } from "@/components/ui/avatar";
import { MessageThread } from "@/components/messages/message-thread";

export const metadata: Metadata = { title: "Conversación" };

export default async function ConversacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { profile } = await requireOnboardedMember();
  const convo = await getConversation(id, profile.id);
  if (!convo) notFound();
  const name = convo.other.display_name ?? convo.other.username ?? "Miembro";
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex items-center gap-4 border-b hairline pb-5">
        <Link href="/mensajes" className="icon-btn -ml-2" aria-label="Volver a mensajes">
          ←
        </Link>
        <Link href={`/miembros/${convo.other.username}`} className="flex items-center gap-3 hover:text-accent">
          <Avatar url={convo.other.avatar_url} name={name} size={44} />
          <span>
            <span className="block font-serif text-xl text-ink">{name}</span>
            <span className="block font-mono text-xs text-muted">@{convo.other.username}</span>
          </span>
        </Link>
      </header>
      <MessageThread conversationId={convo.id} me={profile.id} otherName={name} initial={convo.messages} canWrite={convo.canWrite} />
    </div>
  );
}
