import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getCategories, getPost } from "@/lib/data/posts";
import { PageHeader } from "@/components/ui/page-header";
import { Composer } from "@/components/posts/composer";

export const metadata: Metadata = { title: "Editar publicación" };

export default async function EditarPublicacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { profile } = await requireOnboardedMember();
  const post = await getPost(id, profile.id);
  if (!post) notFound();
  if (post.author_id !== profile.id || post.is_locked) redirect(`/p/${id}`);
  const categories = await getCategories();

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Editar" title="Editar publicación" />
      <Composer
        mode="edit"
        categories={post.circle_id ? undefined : categories}
        lockCategory
        circle={post.circle_id ?? undefined}
        initial={{
          postId: post.id,
          category: post.category_slug,
          title: post.title,
          body: post.body,
          kind: post.kind,
          is_question: post.is_question,
          sources: post.sources,
          tags: post.tags,
          images: post.images,
        }}
      />
    </div>
  );
}
