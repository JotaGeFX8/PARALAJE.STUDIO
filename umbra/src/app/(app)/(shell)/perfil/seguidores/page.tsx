import { requireOnboardedMember } from "@/lib/auth";
import { followList } from "@/lib/data/feed";
import { FollowList } from "@/components/feed/follow-list";

export const metadata = { title: "Seguidores" };

export default async function Page() {
  const { profile } = await requireOnboardedMember();
  const rows = await followList(profile.id, "followers");
  return <FollowList title="Seguidores" back="/perfil" rows={rows} viewerId={profile.id} hidden={false} />;
}
