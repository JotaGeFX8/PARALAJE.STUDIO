import "server-only";
import { createClient } from "@/lib/supabase/server";
import { coverUrl } from "@/lib/media";
import type { Database } from "@/lib/supabase/types";
import type { BookLevelKey, ShelfKey } from "@/lib/content";

type RawCard = Database["public"]["CompositeTypes"]["book_card"];

export type BookCard = {
  id: string;
  slug: string;
  title: string;
  authors: string;
  year: number | null;
  area_slug: string | null;
  area_name: string | null;
  cover_url: string | null;
  rec_count: number;
  avg_rating: number | null;
  want_count: number;
  topics: string[];
  my_shelf: ShelfKey | null;
  my_rec: boolean;
};

function toCards(rows: RawCard[] | null | undefined): BookCard[] {
  return (rows ?? [])
    .filter((r) => r.id && r.slug)
    .map((r) => ({
      id: r.id!,
      slug: r.slug!,
      title: r.title ?? "",
      authors: r.authors ?? "",
      year: r.year,
      area_slug: r.area_slug,
      area_name: r.area_name,
      cover_url: coverUrl(r.cover_path),
      rec_count: r.rec_count ?? 0,
      avg_rating: r.avg_rating === null ? null : Number(r.avg_rating),
      want_count: Number(r.want_count ?? 0),
      topics: r.topics ?? [],
      my_shelf: r.my_shelf,
      my_rec: Boolean(r.my_rec),
    }));
}

export type BookFilters = {
  q?: string;
  area?: string | null;
  topic?: number | null;
  level?: BookLevelKey | null;
  shelf?: ShelfKey | null;
  recommendedBy?: string | null;
  sort?: "recent" | "popular" | "rated";
  page?: number;
};

export const BOOKS_PAGE = 24;

export async function listBooks(f: BookFilters, pageSize = BOOKS_PAGE) {
  const supabase = await createClient();
  const page = f.page ?? 1;
  const { data, error } = await supabase.rpc("book_list", {
    p_query: f.q || undefined,
    p_area: f.area ?? undefined,
    p_topic: f.topic ?? undefined,
    p_level: f.level ?? undefined,
    p_shelf: f.shelf ?? undefined,
    p_recommended_by: f.recommendedBy ?? undefined,
    p_sort: f.sort ?? "recent",
    p_limit: pageSize + 1,
    p_offset: (page - 1) * pageSize,
  });
  if (error) console.error("book_list", error.message);
  const cards = toCards(data);
  return { items: cards.slice(0, pageSize), hasMore: cards.length > pageSize };
}

/** Ficha completa: datos, temas, recomendaciones y estado del usuario. */
export async function getBook(slug: string, userId: string) {
  const supabase = await createClient();
  const { data: book } = await supabase
    .from("books")
    .select("id, slug, title, authors, year, isbn, area_slug, cover_path, created_by, rec_count, rating_sum, rating_count, created_at, area:interest_areas(slug, name), book_topics(topics(id, name, area_slug))")
    .eq("slug", slug)
    .maybeSingle();
  if (!book) return null;
  const [{ data: recs }, { data: shelf }, { data: myVotes }, { data: counts }] = await Promise.all([
    supabase
      .from("book_recommendations")
      .select("id, user_id, body, level, rating, helpful_count, created_at, edited_at, author:profiles!book_recommendations_user_id_fkey(username, display_name, avatar_url)")
      .eq("book_id", book.id)
      .order("helpful_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("book_shelves").select("status").eq("book_id", book.id).eq("user_id", userId).maybeSingle(),
    supabase.from("book_recommendation_votes").select("recommendation_id").eq("user_id", userId),
    // Las estanterías ajenas son privadas: solo se leen los totales.
    supabase.rpc("book_shelf_counts", { p_book: book.id }),
  ]);
  const voted = new Set((myVotes ?? []).map((v) => v.recommendation_id));
  const list = (recs ?? []).map((r) => ({ ...r, helpful_mine: voted.has(r.id) }));
  return {
    ...book,
    cover_url: coverUrl(book.cover_path),
    topics: book.book_topics.map((t) => t.topics).filter((t): t is NonNullable<typeof t> => Boolean(t)),
    avg_rating: book.rating_count ? Math.round((book.rating_sum / book.rating_count) * 10) / 10 : null,
    recommendations: list,
    mine: list.find((r) => r.user_id === userId) ?? null,
    shelf: (shelf?.status ?? null) as ShelfKey | null,
    shelfCounts: { want: Number(counts?.[0]?.want ?? 0), reading: Number(counts?.[0]?.reading ?? 0), read: Number(counts?.[0]?.read ?? 0) },
  };
}
export type BookDetail = NonNullable<Awaited<ReturnType<typeof getBook>>>;

/** Libros relacionados: mismos temas o, si no hay, la misma área. */
export async function relatedBooks(book: { id: string; area_slug: string | null; topics: { id: number }[] }, limit = 4) {
  const byTopic = book.topics.length
    ? (await Promise.all(book.topics.slice(0, 3).map((t) => listBooks({ topic: t.id, sort: "popular" }, 6)))).flatMap((r) => r.items)
    : [];
  const byArea = byTopic.length < limit && book.area_slug ? (await listBooks({ area: book.area_slug, sort: "popular" }, 8)).items : [];
  const seen = new Set<string>([book.id]);
  return [...byTopic, ...byArea].filter((b) => (seen.has(b.id) ? false : (seen.add(b.id), true))).slice(0, limit);
}
