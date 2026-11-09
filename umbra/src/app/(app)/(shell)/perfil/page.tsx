import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { getMemberByUsername } from "@/lib/data/members";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const { profile } = await requireOnboardedMember();
  const full = await getMemberByUsername(profile.username!);
  if (!full) return null;
  return (
    <ProfileView
      p={full}
      actions={
        <>
          <Link href="/perfil/editar" className="btn btn-ghost min-h-11 text-sm">Editar perfil</Link>
          <Link href="/ajustes" className="btn btn-quiet min-h-11 text-sm">Ajustes</Link>
        </>
      }
    />
  );
}
