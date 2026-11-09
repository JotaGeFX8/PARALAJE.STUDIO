import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getForum } from "@/lib/data/posts";
import { ForumView } from "@/components/posts/forum-view";

type Props = {
  params: Promise<{ slug: string; sub: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, sub } = await params;
  const f = await getForum(slug);
  const c = f?.categories.find((x) => x.slug === sub);
  return { title: c ? `${c.name} · ${f?.name}` : "Foro" };
}

export default async function SubcategoriaPage({ params, searchParams }: Props) {
  const { profile } = await requireOnboardedMember();
  const { slug, sub } = await params;
  const forum = await getForum(slug);
  const category = forum?.categories.find((c) => c.slug === sub);
  if (!forum || !category) notFound();
  return (
    <ForumView
      forum={forum}
      sub={category}
      sp={await searchParams}
      canWrite={profile.role !== "restricted"}
      firstName={(profile.display_name ?? profile.username ?? "").split(" ")[0]}
    />
  );
}
