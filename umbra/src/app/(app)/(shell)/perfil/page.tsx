import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { getMemberByUsername } from "@/lib/data/members";
import { getMyCatalogState } from "@/lib/data/catalog";
import { ProfilePage, parseProfileTab } from "@/components/profile/profile-page";
import { ShareButton } from "@/components/ui/share-button";
import { oneParam } from "@/lib/format";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function PerfilPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { profile } = await requireOnboardedMember();
  const tab = parseProfileTab(oneParam((await searchParams).ver));
  const [full, mine] = await Promise.all([getMemberByUsername(profile.username!), getMyCatalogState(profile.id)]);
  if (!full) return null;
  return (
    <ProfilePage
      p={full}
      base="/perfil"
      tab={tab}
      own
      privacy={mine.privacy}
      actions={
        <>
          <Link href="/perfil/editar" className="btn btn-ghost min-h-11 text-sm">
            Editar perfil
          </Link>
          <span className="btn btn-ghost min-h-11 !p-0 text-sm [&>button]:h-full [&>button]:w-full [&>button]:justify-center [&>button]:px-4">
            <ShareButton path={`/miembros/${profile.username}`} title={full.display_name} />
          </span>
          <Link href="/ajustes" className="btn btn-ghost min-h-11 text-sm">
            Ajustes
          </Link>
        </>
      }
    />
  );
}
