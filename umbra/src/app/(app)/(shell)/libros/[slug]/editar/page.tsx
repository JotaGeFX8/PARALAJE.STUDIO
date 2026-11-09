import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getBook } from "@/lib/data/books";
import { getCatalog } from "@/lib/data/catalog";
import { PageHeader } from "@/components/ui/page-header";
import { BookForm } from "@/components/books/book-form";

export const metadata: Metadata = { title: "Corregir ficha" };

export default async function EditarLibroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { profile } = await requireOnboardedMember();
  const book = await getBook(slug, profile.id);
  if (!book) notFound();
  const isStaff = profile.role === "admin" || profile.role === "moderator";
  const othersRecommended = book.recommendations.some((r) => r.user_id !== profile.id);
  if (!isStaff && (book.created_by !== profile.id || othersRecommended)) redirect(`/libros/${slug}`);
  const catalog = await getCatalog();
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Biblioteca" title="Corregir la ficha" lead="Título, autoría, año, ISBN, área, temas y portada." />
      <BookForm
        mode="edit"
        catalog={catalog}
        initial={{
          id: book.id,
          title: book.title,
          authors: book.authors,
          year: book.year,
          isbn: book.isbn,
          area_slug: book.area_slug,
          topics: book.topics.map((t) => t.id),
          cover_url: book.cover_url,
        }}
      />
    </div>
  );
}
