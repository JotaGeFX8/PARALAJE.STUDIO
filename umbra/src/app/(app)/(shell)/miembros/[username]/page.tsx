import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getMemberByUsername } from "@/lib/data/members";
import { isBlockedByMe, memberCard } from "@/lib/data/social";
import { followStats } from "@/lib/data/feed";
import { ProfilePage, parseProfileTab } from "@/components/profile/profile-page";
import { ConnectButton } from "@/components/social/connect-button";
import { FollowButton } from "@/components/feed/follow-button";
import { MemberSafetyActions } from "@/components/social/member-actions";
import { USERNAME_RE } from "@/lib/validation/profile";
import { oneParam } from "@/lib/format";

type Props = { params: Promise<{ username: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${decodeURIComponent(username)}`, robots: { index: false } };
}

export default async function MiembroPage({ params, searchParams }: Props) {
  const { username: raw } = await params;
  const username = decodeURIComponent(raw);
  if (!USERNAME_RE.test(username)) notFound();
  const { profile } = await requireOnboardedMember();
  if (profile.username?.toLowerCase() === username.toLowerCase()) redirect("/perfil");

  const member = await getMemberByUsername(username);
  if (!member) notFound();
  const tab = parseProfileTab(oneParam((await searchParams).ver));
  const [card, blocked, stats] = await Promise.all([memberCard(member.id), isBlockedByMe(profile.id, member.id), followStats(member.id)]);
  const name = member.display_name || member.username;

  return (
    <ProfilePage
      p={member}
      base={`/miembros/${member.username}`}
      tab={tab}
      own={false}
      shared={card?.shared_topics}
      reasons={card?.reasons}
      footer={<MemberSafetyActions otherId={member.id} blocked={blocked} />}
      actions={
        blocked ? (
          <span className="label">Has bloqueado a esta persona</span>
        ) : (
          <>
            <FollowButton profileId={member.id} initial={stats.iFollow} followsMe={stats.followsMe} />
            <ConnectButton otherId={member.id} otherName={name} initial={card?.connection ?? "none"} />
          </>
        )
      }
    />
  );
}
