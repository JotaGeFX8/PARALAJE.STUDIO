import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getMemberByUsername } from "@/lib/data/members";
import { ProfileView } from "@/components/profile/profile-view";
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

  return (
    <ProfileView
      p={member}
      actions={
        <span className="label border border-line-2 px-3 py-2.5 !text-[0.625rem]">Conectar · Fase 4</span>
      }
    />
  );
}
