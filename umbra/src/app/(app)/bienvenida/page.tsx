import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { getCatalog, getMyCatalogState } from "@/lib/data/catalog";
import { Wordmark } from "@/components/ui/logo";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { SignOutButton } from "@/components/shell/sign-out";
import type { GoalKey } from "@/lib/content";

export const metadata: Metadata = { title: "Bienvenida" };

export default async function BienvenidaPage() {
  const { profile } = await requireMember();
  if (profile.onboarded_at) redirect("/explorar");
  const [catalog, mine] = await Promise.all([getCatalog(), getMyCatalogState(profile.id)]);

  return (
    <div className="min-h-[100dvh] px-5 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-8">
      <header className="mx-auto flex max-w-2xl items-center justify-between">
        <Wordmark className="text-ink" />
        <SignOutButton />
      </header>
      <main className="mx-auto max-w-2xl pt-14 md:pt-20">
        <ProfileEditor
          mode="onboarding"
          profile={profile}
          catalog={catalog}
          initial={{ topics: mine.topics, goals: mine.goals as GoalKey[], privacy: mine.privacy }}
        />
      </main>
    </div>
  );
}
