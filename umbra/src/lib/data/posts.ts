import "server-only";
import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/media";
import { toPostItems, type PostItem, type PostKindDb, type PostTypeDb, type ReactionType } from "@/lib/supabase/types";
import type { SortKey } from "@/lib/content";

export const PAGE_SIZE = 20;

export type FeedParams = {
  scope?: "all" | "circle";
  forum?: string | null;
  category?: string | null;
  circle?: string | null;
  tag?: string | null;
  kind?: PostKindDb | null;
  type?: PostTypeDb | null;
  author?: string | null;
  sort?: SortKey;
  savedOnly?: boolean;
  unanswered?: boolean;
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
    p_forum: p.forum ?? undefined,
    p_category: p.category ?? undefined,
    p_circle: p.circle ?? undefined,
    p_tag: p.tag ?? undefined,
    p_kind: p.kind ?? undefined,
    p_type: p.type ?? undefined,
    p_author: p.author ?? undefined,
    p_sort: p.sort ?? "recent",
    p_saved_only: p.savedOnly ?? false,
    p_unanswered: p.unanswered ?? false,
    p_limit: limit + 1,
    p_offset: (page - 1) * limit,
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

export type Forum = { slug: string; name: string; description: string; rules: string; position: number; is_archived: boolean };
export type Subcategory = { slug: string; name: string; description: string; position: number; forum_slug: string };

/** Foros activos con sus subcategorías, en orden. */
export async function getForums(): Promise<(Forum & { categories: Subcategory[] })[]> {
  const supabase = await createClient();
  const [{ data: forums }, { data: cats }] = await Promise.all([
    supabase.from("forums").select("slug, name, description, rules, position, is_archived").eq("is_archived", false).order("position"),
    supabase.from("categories").select("slug, name, description, position, forum_slug").eq("is_archived", false).order("position"),
  ]);
  return (forums ?? []).map((f) => ({ ...f, categories: (cats ?? []).filter((c) => c.forum_slug === f.slug) }));
}

export async function getForum(slug: string) {
  const forums = await getForums();
  return forums.find((f) => f.slug === slug) ?? null;
}

/** Subcategoría por su identificador (para redirigir las direcciones antiguas de territorios). */
export async function getCategory(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("slug, name, description, forum_slug").eq("slug", slug).maybeSingle();
  return data;
}

/** Publicaciones, sin responder y última actividad por foro y subcategoría. */
export async function getForumStats() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("forum_stats");
  const byForum = new Map<string, { count: number; unanswered: number; last: string | null }>();
  const byCategory = new Map<string, { count: number; unanswered: number; last: string | null }>();
  for (const r of data ?? []) {
    const add = (m: typeof byForum, k: string) => {
      const cur = m.get(k) ?? { count: 0, unanswered: 0, last: null };
      cur.count += Number(r.post_count);
      cur.unanswered += Number(r.unanswered);
      if (!cur.last || (r.last_activity_at && r.last_activity_at > cur.last)) cur.last = r.last_activity_at;
      m.set(k, cur);
    };
    if (r.forum_slug) add(byForum, r.forum_slug);
    if (r.category_slug) add(byCategory, r.category_slug);
  }
  return { byForum, byCategory };
}

export async function getTrendingTags(limit = 12) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("trending_tags", { p_limit: limit });
  return data ?? [];
}

export async function getTag(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("slug, name, status, merged_into").eq("slug", slug).maybeSingle();
  return data;
}

export async function searchTags(q: string) {
  const supabase = await createClient();
  const term = q.replace(/[%_,()]/g, " ").trim();
  if (!term) return [];
  const { data } = await supabase
    .from("tags")
    .select("slug, name")
    .eq("status", "active")
    .is("merged_into", null)
    .or(`slug.ilike.%${term}%,name.ilike.%${term}%`)
    .limit(20);
  return data ?? [];
}

const POST_COLUMNS = `
  id, title, body, kind, post_type, is_draft, audience, image_alt, is_question, sources, image_paths, comment_count, reaction_count,
  is_locked, is_pinned, created_at, edited_at, deleted_at, forum_slug, category_slug, circle_id, author_id,
  author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url),
  category:categories(slug, name),
  forum:forums(slug, name),
  post_tags(tag_slug),
  post_attachments(id, path, name, mime, size)
`;

/** Publicación completa con imágenes y adjuntos firmados y el estado del usuario (guardada, seguida). */
export async function getPost(id: string, userId: string) {
  const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select(POST_COLUMNS).eq("id", id).maybeSingle();
  if (!post || post.deleted_at) return null;

  const [{ data: saved }, { data: follow }, images, attachments, poll] = await Promise.all([
    supabase.from("saved_posts").select("post_id").eq("post_id", id).eq("user_id", userId).maybeSingle(),
    supabase.from("post_follows").select("post_id").eq("post_id", id).eq("user_id", userId).maybeSingle(),
    signImages(post.image_paths),
    signAttachments(post.post_attachments),
    post.post_type === "poll" ? getPoll(id) : Promise.resolve(null),
  ]);

  return {
    ...post,
    tags: post.post_tags.map((t) => t.tag_slug),
    images,
    attachments,
    poll,
    saved: Boolean(saved),
    following: Boolean(follow),
  };
}
export type PostDetail = NonNullable<Awaited<ReturnType<typeof getPost>>>;

export type PollState = {
  multiple: boolean;
  closesAt: string | null;
  closed: boolean;
  voters: number;
  options: { id: number; label: string; votes: number; mine: boolean }[];
};

/** Resultados agregados de una encuesta (nunca quién votó qué). */
export async function getPoll(postId: string): Promise<PollState | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("poll_results", { p_post: postId });
  if (!data?.length) return null;
  const first = data[0];
  return {
    multiple: first.multiple,
    closesAt: first.closes_at,
    closed: first.closed,
    voters: Number(first.voters),
    options: data.map((o) => ({ id: o.option_id, label: o.label, votes: Number(o.votes), mine: o.mine })),
  };
}

export type Attachment = { id: string; path: string; name: string; mime: string; size: number; url: string | null };

/** Enlaces de descarga firmados (1 h); el navegador los descarga como archivo, nunca los muestra como página. */
export async function signAttachments(rows: { id: string; path: string; name: string; mime: string; size: number }[]): Promise<Attachment[]> {
  if (!rows.length) return [];
  const supabase = await createClient();
  return Promise.all(
    rows.map(async (r) => {
      const { data } = await supabase.storage.from("post-files").createSignedUrl(r.path, 3600, { download: r.name });
      return { ...r, url: data?.signedUrl ?? null };
    }),
  );
}

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
  like: { total: 0, mine: false },
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
