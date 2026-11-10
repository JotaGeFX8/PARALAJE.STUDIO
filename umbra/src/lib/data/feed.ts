import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toPostItems, type PostItem } from "@/lib/supabase/types";
import { signImages } from "./posts";

export type FeedEntry = PostItem & {
  images: { path: string; url: string }[];
  body: string;
  liked: boolean;
  likes: number;
  saved: boolean;
  area_name: string | null;
};

/** Completa un listado con fotos firmadas, texto completo y el estado propio (me gusta, guardado). */
export async function hydrateFeed(items: PostItem[], userId: string): Promise<FeedEntry[]> {
  if (!items.length) return [];
  const supabase = await createClient();
  const ids = items.map((i) => i.id);
  const [{ data: rows }, { data: likes }, { data: mine }, { data: saved }] = await Promise.all([
    supabase.from("posts").select("id, body, image_paths, area:interest_areas(name)").in("id", ids),
    supabase.from("post_reactions").select("post_id").eq("type", "like").in("post_id", ids),
    supabase.from("post_reactions").select("post_id").eq("type", "like").eq("user_id", userId).in("post_id", ids),
    supabase.from("saved_posts").select("post_id").eq("user_id", userId).in("post_id", ids),
  ]);
  const byId = new Map((rows ?? []).map((r) => [r.id, r]));
  const allPaths = (rows ?? []).flatMap((r) => r.image_paths);
  const signed = await signImages(allPaths);
  const url = new Map(signed.map((s) => [s.path, s.url]));
  const likeCount = new Map<string, number>();
  for (const l of likes ?? []) likeCount.set(l.post_id, (likeCount.get(l.post_id) ?? 0) + 1);
  const liked = new Set((mine ?? []).map((m) => m.post_id));
  const isSaved = new Set((saved ?? []).map((m) => m.post_id));
  return items.map((i) => {
    const r = byId.get(i.id);
    return {
      ...i,
      body: r?.body ?? i.excerpt,
      images: (r?.image_paths ?? []).flatMap((p) => (url.get(p) ? [{ path: p, url: url.get(p)! }] : [])),
      liked: liked.has(i.id),
      likes: likeCount.get(i.id) ?? 0,
      saved: isSaved.has(i.id),
      area_name: r?.area?.name ?? null,
    };
  });
}

export async function getHomeFeed(mode: "for_you" | "following", userId: string, page = 1, limit = 10) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("home_feed", { p_mode: mode, p_limit: limit + 1, p_offset: (page - 1) * limit });
  if (error) console.error("home_feed", error.message);
  const items = toPostItems(data);
  return { items: await hydrateFeed(items.slice(0, limit), userId), hasMore: items.length > limit };
}

/** Cuadrícula de fotos: de un perfil o, sin autor, las más destacadas de la comunidad. */
export async function profilePhotos(authorId: string | null, limit = 30) {
  const supabase = await createClient();
  let q = supabase.from("posts").select("id, image_paths, reaction_count, comment_count");
  q = authorId ? q.eq("author_id", authorId) : q.gt("created_at", new Date(Date.now() - 90 * 86_400_000).toISOString());
  const { data } = await q
    .is("circle_id", null)
    .is("deleted_at", null)
    .eq("is_draft", false)
    .not("image_paths", "eq", "{}")
    .order(authorId ? "created_at" : "reaction_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  const signed = await signImages(rows.map((r) => r.image_paths[0]));
  const url = new Map(signed.map((s) => [s.path, s.url]));
  return rows.map((r) => ({ id: r.id, cover: url.get(r.image_paths[0]) ?? null, many: r.image_paths.length > 1, likes: r.reaction_count, comments: r.comment_count }));
}

export async function myDrafts(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, body, image_paths, updated:created_at")
    .eq("author_id", userId)
    .eq("is_draft", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function followStats(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("follow_stats", { p_profile: profileId });
  const r = data?.[0];
  return {
    followers: Number(r?.followers ?? 0),
    following: Number(r?.following ?? 0),
    posts: Number(r?.posts ?? 0),
    iFollow: Boolean(r?.i_follow),
    followsMe: Boolean(r?.follows_me),
  };
}

export async function followList(profileId: string, kind: "followers" | "following") {
  const supabase = await createClient();
  const { data } = await supabase.rpc("follow_list", { p_profile: profileId, p_kind: kind, p_limit: 100 });
  return data ?? [];
}
