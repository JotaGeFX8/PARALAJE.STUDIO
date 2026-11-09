"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { getActionContext, dbErrorMessage, SESSION_EXPIRED } from "@/lib/actions";
import { fieldErrors, type FormState } from "@/lib/form-state";
import { bookSchema, readBook, readRecommendation, recommendationSchema } from "@/lib/validation/books";
import type { ShelfKey } from "@/lib/content";

type Supa = Awaited<ReturnType<typeof getActionContext>>["supabase"];
type Result = { ok: boolean; message?: string };

const COVER_TYPES = /^image\/(webp|jpeg|png)$/;

async function uploadBookCover(supabase: Supa, userId: string, fd: FormData): Promise<string | null> {
  const file = fd.get("cover");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!COVER_TYPES.test(file.type) || file.size > 3 * 1024 * 1024) throw new Error("Portada JPG, PNG o WebP de hasta 3 MB.");
  const path = `${userId}/libro-${randomUUID()}.webp`;
  const { error } = await supabase.storage.from("covers").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw new Error("No se pudo subir la portada.");
  return path;
}

/** Recomienda un libro: crea la ficha (o reutiliza la existente) y guarda la recomendación propia. */
export async function recommendBookAction(_: FormState, fd: FormData): Promise<FormState> {
  const rawBook = readBook(fd);
  const rawRec = readRecommendation(fd);
  const values = { title: rawBook.title, authors: rawBook.authors, body: rawRec.body };
  const book = bookSchema.safeParse(rawBook);
  const rec = recommendationSchema.safeParse(rawRec);
  if (!book.success || !rec.success) {
    return {
      errors: { ...(book.success ? {} : fieldErrors(book.error)), ...(rec.success ? {} : fieldErrors(rec.error)) },
      message: "Revisa los campos marcados.",
      values,
    };
  }
  const { supabase, userId } = await getActionContext();
  if (!userId) return { message: SESSION_EXPIRED, values };
  let cover: string | null = null;
  try {
    cover = await uploadBookCover(supabase, userId, fd);
  } catch (e) {
    return { errors: { cover: (e as Error).message }, values };
  }
  const b = book.data;
  const r = rec.data;
  const { data: slug, error } = await supabase.rpc("recommend_book", {
    p_title: b.title,
    p_authors: b.authors,
    p_year: b.year ?? undefined,
    p_isbn: b.isbn || undefined,
    p_area: b.area || undefined,
    p_topics: b.topics,
    p_cover_path: cover ?? undefined,
    p_body: r.body,
    p_level: r.level,
    p_rating: r.rating ?? undefined,
  });
  if (error || !slug) {
    if (cover) await supabase.storage.from("covers").remove([cover]);
    return { message: dbErrorMessage(error, "No se ha podido guardar la recomendación."), values };
  }
  // Si la ficha ya existía, la portada nueva no se usa.
  if (cover) {
    const { data: used } = await supabase.from("books").select("id").eq("cover_path", cover).maybeSingle();
    if (!used) await supabase.storage.from("covers").remove([cover]);
  }
  redirect(`/libros/${slug}`);
}

/** Recomendación propia de un libro ya existente (crear o editar). */
export async function saveRecommendationAction(_: FormState, fd: FormData): Promise<FormState> {
  const bookId = String(fd.get("book_id") ?? "");
  const raw = readRecommendation(fd);
  const parsed = recommendationSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { body: raw.body } };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { message: SESSION_EXPIRED };
  const { data: book } = await supabase.from("books").select("title, authors").eq("id", bookId).maybeSingle();
  if (!book) return { message: "El libro no existe." };
  const { error } = await supabase.rpc("recommend_book", {
    p_title: book.title,
    p_authors: book.authors,
    p_body: parsed.data.body,
    p_level: parsed.data.level,
    p_rating: parsed.data.rating ?? undefined,
  });
  if (error) return { message: dbErrorMessage(error, "No se ha podido guardar."), values: { body: raw.body } };
  refresh();
  return { ok: true, message: "Recomendación guardada." };
}

export async function deleteRecommendationAction(recId: string): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error, count } = await supabase.from("book_recommendations").delete({ count: "exact" }).eq("id", recId).eq("user_id", userId);
  if (error || !count) return { ok: false, message: dbErrorMessage(error, "No se pudo borrar.") };
  refresh();
  return { ok: true };
}

export async function setShelfAction(bookId: string, status: ShelfKey | null): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = await supabase.rpc("set_book_shelf", { p_book: bookId, p_status: status ?? undefined });
  if (error) return { ok: false, message: dbErrorMessage(error) };
  refresh();
  return { ok: true };
}

export async function setHelpfulAction(recId: string, on: boolean): Promise<Result> {
  const { supabase, userId } = await getActionContext();
  if (!userId) return { ok: false, message: SESSION_EXPIRED };
  const { error } = on
    ? await supabase.from("book_recommendation_votes").upsert({ recommendation_id: recId, user_id: userId }, { ignoreDuplicates: true })
    : await supabase.from("book_recommendation_votes").delete().eq("recommendation_id", recId).eq("user_id", userId);
  if (error) return { ok: false, message: dbErrorMessage(error, "No se pudo registrar.") };
  return { ok: true };
}

/** Coincidencias mientras se escribe el título: evita fichas duplicadas. */
export async function searchBooksAction(q: string) {
  const query = String(q ?? "").trim().slice(0, 80);
  if (query.length < 2) return [];
  const { supabase, userId } = await getActionContext();
  if (!userId) return [];
  const { data } = await supabase.rpc("search_books", { p_query: query, p_limit: 5 });
  return data ?? [];
}

/** Corrección de la ficha (quien la creó mientras sea la única recomendación, o el equipo). */
export async function updateBookAction(_: FormState, fd: FormData): Promise<FormState> {
  const bookId = String(fd.get("book_id") ?? "");
  const raw = readBook(fd);
  const parsed = bookSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Revisa los campos marcados." };
  const { supabase, userId } = await getActionContext();
  if (!userId) return { message: SESSION_EXPIRED };
  let cover: string | null = null;
  try {
    cover = await uploadBookCover(supabase, userId, fd);
  } catch (e) {
    return { errors: { cover: (e as Error).message } };
  }
  const b = parsed.data;
  const { error } = await supabase.rpc("update_book", {
    p_book: bookId,
    p_title: b.title,
    p_authors: b.authors,
    p_year: b.year ?? undefined,
    p_isbn: b.isbn,
    p_area: b.area,
    p_topics: b.topics,
    // Sin cambios: se omite; quitar la portada: cadena vacía.
    p_cover_path: cover ?? (fd.get("remove_cover") === "on" ? "" : undefined),
  });
  if (error) {
    if (cover) await supabase.storage.from("covers").remove([cover]);
    return { message: dbErrorMessage(error, "No se pudo guardar la ficha.") };
  }
  const { data: book } = await supabase.from("books").select("slug").eq("id", bookId).maybeSingle();
  redirect(`/libros/${book?.slug ?? ""}`);
}
