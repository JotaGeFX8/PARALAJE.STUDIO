import type { Metadata } from "next";
import { requireOnboardedMember } from "@/lib/auth";
import { getCatalog, getMyCatalogState } from "@/lib/data/catalog";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileEditor } from "@/components/profile/profile-editor";
import type { GoalKey } from "@/lib/content";

export const metadata: Metadata = { title: "Editar perfil" };

export default async function EditarPerfilPage() {
  const { profile } = await requireOnboardedMember();
  const [catalog, mine] = await Promise.all([getCatalog(), getMyCatalogState(profile.id)]);
  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Perfil" title="Editar perfil" />
      <ProfileEditor
        mode="edit"
        profile={profile}
        catalog={catalog}
        initial={{ topics: mine.topics, goals: mine.goals as GoalKey[], privacy: mine.privacy }}
      />
    </div>
  );
}
