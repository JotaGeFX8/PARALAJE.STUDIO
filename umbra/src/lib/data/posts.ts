import "server-only";
import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/media";
import { toPostItems, type PostItem, type PostKindDb, type ReactionType } from "@/lib/supabase/types";
import type { SortKey } from "@/lib/content";

export const PAGE_SIZE = 20;

export type FeedParams = {
  scope?: "all" | "forum" | "agora" | "circle";
  category?: string | null;
  circle?: string | null;
  tag?: string | null;
  kind?: PostKindDb | null;
  author?: string | null;
  sort?: SortKey;
  savedOnly?: boolean;
  questionsOnly?: boolean;
  page?: number;
  limit?: number;
};

/** Listado de publicaciones. Devuelve una más de las pedidas para saber si hay siguiente página. */
export async function getFeed(p: FeedParams): Promise<{ items: PostItem[]; hasMore: boolean }> {
  const supabase = await createClient();
  const limit = p.limit ?? PAGE_SIZE;
  const page = p.page ?? 1;
  const { data, error } = await supabase.rpc("feed_posts", {
    p_scope: p.scope ?? "all",
    p_category: p.category ?? undefined,
    p_circle: p.circle ?? undefined,
    p_tag: p.tag ?? undefined,
    p_kind: p.kind ?? undefined,
    p_author: p.author ?? undefined,
    p_sort: p.sort ?? "recent",
    p_saved_only: p.savedOnly ?? false,
    p_limit: limit + 1,
    p_offset: (page - 1) * limit,
    p_questions_only: p.questionsOnly ?? false,
  });
  if (error) console.error("feed_posts", error.code, error.message);
  const items = toPostItems(data);
  return { items: items.slice(0, limit), hasMore: items.length > limit };
}

export async function searchPosts(q: string, page = 1) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_posts", {
    p_query: q,
    p_limit: PAGE_SIZE + 1,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  if (error) console.error("search_posts", error.code, error.message);
  const items = toPostItems(data);
  return { items: items.slice(0, PAGE_SIZE), hasMore: items.length > PAGE_SIZE };
}

export async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("slug, name, description, position").order("position");
  return data ?? [];
}

export async function getCategory(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("slug, name, description").eq("slug", slug).maybeSingle();
  return data;
}

export async function getCategoryStats() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("category_stats");
  return new Map((data ?? []).map((r) => [r.slug, { count: Number(r.post_count), last: r.last_activity_at }]));
}

export async function getTrendingTags(limit = 12) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("trending_tags", { p_limit: limit });
  return data ?? [];
}

export async function getTag(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("slug, name").eq("slug", slug).maybeSingle();
  return data;
}

export async function searchTags(q: string) {
  const supabase = await createClient();
  const term = q.replace(/[%_,()]/g, " ").trim();
  if (!term) return [];
  const { data } = await supabase
    .from("tags")
    .select("slug, name")
    .or(`slug.ilike.%${term}%,name.ilike.%${term}%`)
    .limit(20);
  return data ?? [];
}

const POST_COLUMNS = `
  id, title, body, kind, is_question, sources, image_paths, comment_count, reaction_count,
  is_locked, is_pinned, created_at, edited_at, deleted_at, category_slug, circle_id, author_id,
  author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url),
  category:categories(slug, name),
  post_tags(tag_slug)
`;

/** Publicación completa con imágenes firmadas y el estado del usuario (guardada, seguida). */
export async function getPost(id: string, userId: string) {
  const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select(POST_COLUMNS).eq("id", id).maybeSingle();
  if (!post || post.deleted_at) return null;

  const [{ data: saved }, { data: follow }, images] = await Promise.all([
    supabase.from("saved_posts").select("post_id").eq("post_id", id).eq("user_id", userId).maybeSingle(),
    supabase.from("post_follows").select("post_id").eq("post_id", id).eq("user_id", userId).maybeSingle(),
    signImages(post.image_paths),
  ]);

  return {
    ...post,
    tags: post.post_tags.map((t) => t.tag_slug),
    images,
    saved: Boolean(saved),
    following: Boolean(follow),
  };
}
export type PostDetail = NonNullable<Awaited<ReturnType<typeof getPost>>>;

/** URLs firmadas (1 h) para imágenes del bucket privado. */
export async function signImages(paths: string[]) {
  if (!paths.length) return [];
  const supabase = await createClient();
  const { data } = await supabase.storage.from("post-images").createSignedUrls(paths, 3600);
  return (data ?? []).flatMap((d) => (d.signedUrl ? [{ path: d.path ?? "", url: mediaUrl(d.signedUrl as string) }] : []));
}

export type CommentNode = {
  id: string;
  parent_id: string | null;
  depth: number;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  author_id: string;
  author: { username: string | null; display_name: string | null; avatar_url: string | null } | null;
  reaction_count: number;
  children: CommentNode[];
};

/** Comentarios de una publicación en forma de árbol. */
export async function getCommentTree(postId: string, order: "oldest" | "valued" = "oldest") {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select(
      "id, parent_id, depth, body, created_at, edited_at, deleted_at, author_id, reaction_count, author:profiles!comments_author_id_fkey(username, display_name, avatar_url)",
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(1000);

  const nodes = new Map<string, CommentNode>();
  for (const c of data ?? []) nodes.set(c.id, { ...c, children: [] });
  const roots: CommentNode[] = [];
  for (const n of nodes.values()) {
    const parent = n.parent_id ? nodes.get(n.parent_id) : undefined;
    if (parent) parent.children.push(n);
    else roots.push(n);
  }
  if (order === "valued") roots.sort((a, b) => b.reaction_count - a.reaction_count);
  return { roots, total: nodes.size };
}

export type ReactionState = Record<ReactionType, { total: number; mine: boolean }>;

const EMPTY: ReactionState = {
  valuable: { total: 0, mine: false },
  curious: { total: 0, mine: false },
  agree: { total: 0, mine: false },
  needs_sources: { total: 0, mine: false },
};

/** Reacciones de la publicación y de sus comentarios. */
export async function getReactions(postId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("reaction_summary", { p_post: postId });
  const post: ReactionState = structuredClone(EMPTY);
  const comments = new Map<string, ReactionState>();
  for (const r of data ?? []) {
    const bucket = r.target === "post" ? post : comments.get(r.target_id) ?? structuredClone(EMPTY);
    bucket[r.type] = { total: Number(r.total), mine: r.mine };
    if (r.target === "comment") comments.set(r.target_id, bucket);
  }
  return { post, comments, empty: EMPTY };
}
