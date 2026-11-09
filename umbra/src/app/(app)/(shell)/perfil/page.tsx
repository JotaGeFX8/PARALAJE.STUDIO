import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { getMemberByUsername } from "@/lib/data/members";
import { getMyCatalogState } from "@/lib/data/catalog";
import { ProfileView } from "@/components/profile/profile-view";
import { getFeed } from "@/lib/data/posts";
import { PostList } from "@/components/posts/post-row";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const { profile } = await requireOnboardedMember();
  const [full, mine, { items }] = await Promise.all([
    getMemberByUsername(profile.username!),
    getMyCatalogState(profile.id),
    getFeed({ scope: "all", author: profile.id, limit: 10 }),
  ]);
  if (!full) return null;
  return (
    <>
      <ProfileView
        p={full}
        own
        privacy={mine.privacy}
        actions={
          <>
            <Link href="/perfil/editar" className="btn btn-ghost min-h-11 text-sm">
              Editar perfil
            </Link>
            <Link href="/ajustes" className="btn btn-quiet min-h-11 text-sm">
              Ajustes
            </Link>
          </>
        }
      />
      <section className="mt-16 max-w-5xl">
        <h2 className="label mb-2">Mis publicaciones</h2>
        <PostList
          items={items}
          empty={
            <>
              Aún no has publicado nada.{" "}
              <Link href="/publicar" className="link">
                Comparte tu primera idea
              </Link>
              .
            </>
          }
        />
      </section>
    </>
  );
}
