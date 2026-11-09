import type { Metadata } from "next";
import { requireOnboardedMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileEditor } from "@/components/profile/profile-editor";

export const metadata: Metadata = { title: "Editar perfil" };

export default async function EditarPerfilPage() {
  const { profile } = await requireOnboardedMember();
  const supabase = await createClient();
  const [{ data: interests }, { data: mine }] = await Promise.all([
    supabase.from("interests").select("slug, name").order("position"),
    supabase.from("profile_interests").select("interest_slug, is_favorite").eq("profile_id", profile.id),
  ]);
  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Perfil" title="Editar perfil" />
      <ProfileEditor
        mode="edit"
        profile={profile}
        interests={interests ?? []}
        selected={(mine ?? []).map((m) => m.interest_slug)}
        favorites={(mine ?? []).filter((m) => m.is_favorite).map((m) => m.interest_slug)}
      />
    </div>
  );
}
