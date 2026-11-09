import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getCategory, getForum } from "@/lib/data/posts";
import { ForumView } from "@/components/posts/forum-view";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const f = await getForum(slug);
  return { title: f?.name ?? "Foro" };
}

export default async function ForoPage({ params, searchParams }: Props) {
  const { profile } = await requireOnboardedMember();
  const { slug } = await params;
  const forum = await getForum(slug);
  if (!forum) {
    // Direcciones antiguas de territorios: ahora son subcategorías de un foro.
    const cat = await getCategory(slug);
    if (cat) redirect(`/comunidad/${cat.forum_slug}/${cat.slug}`);
    notFound();
  }
  return (
    <ForumView
      forum={forum}
      sub={null}
      sp={await searchParams}
      canWrite={profile.role !== "restricted"}
      firstName={(profile.display_name ?? profile.username ?? "").split(" ")[0]}
    />
  );
}
