import { notFound } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getMemberByUsername } from "@/lib/data/members";
import { followList } from "@/lib/data/feed";
import { FollowList } from "@/components/feed/follow-list";

export const metadata = { title: "Seguidos" };

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { profile } = await requireOnboardedMember();
  const member = await getMemberByUsername(decodeURIComponent((await params).username));
  if (!member) notFound();
  const rows = await followList(member.id, "following");
  return <FollowList title="Seguidos" back={`/miembros/${member.username}`} rows={rows} viewerId={profile.id} hidden={!member.visible.network} />;
}
