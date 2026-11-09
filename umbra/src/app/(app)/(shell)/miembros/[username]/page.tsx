import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getMemberByUsername } from "@/lib/data/members";
import { isBlockedByMe, memberCard } from "@/lib/data/social";
import { getFeed } from "@/lib/data/posts";
import { ProfileView } from "@/components/profile/profile-view";
import { ConnectButton } from "@/components/social/connect-button";
import { MemberSafetyActions } from "@/components/social/member-actions";
import { PostList } from "@/components/posts/post-row";
import { USERNAME_RE } from "@/lib/validation/profile";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${decodeURIComponent(username)}`, robots: { index: false } };
}

export default async function MiembroPage({ params }: Props) {
  const { username: raw } = await params;
  const username = decodeURIComponent(raw);
  if (!USERNAME_RE.test(username)) notFound();

  const { profile } = await requireOnboardedMember();
  if (profile.username?.toLowerCase() === username.toLowerCase()) redirect("/perfil");

  const member = await getMemberByUsername(username);
  if (!member) notFound();
  const [card, blocked, { items }] = await Promise.all([
    memberCard(member.id),
    isBlockedByMe(profile.id, member.id),
    getFeed({ scope: "all", author: member.id, limit: 5 }),
  ]);
  const name = member.display_name ?? member.username ?? "";

  return (
    <>
      <ProfileView
        p={member}
        shared={card?.shared_interests}
        actions={
          blocked ? (
            <span className="label">Has bloqueado a esta persona</span>
          ) : (
            <ConnectButton otherId={member.id} otherName={name} initial={card?.connection ?? "none"} />
          )
        }
        footer={<MemberSafetyActions otherId={member.id} blocked={blocked} />}
      />
      {!blocked && items.length > 0 && (
        <section className="mt-16 max-w-5xl">
          <h2 className="label mb-2">Publicaciones recientes</h2>
          <PostList items={items} empty={null} />
        </section>
      )}
    </>
  );
}
