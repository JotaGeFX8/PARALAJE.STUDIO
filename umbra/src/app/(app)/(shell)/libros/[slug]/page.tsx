import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { getBook, relatedBooks } from "@/lib/data/books";
import { Avatar } from "@/components/ui/avatar";
import { BookCover, Stars } from "@/components/books/book-cover";
import { HelpfulButton, RecommendationForm, ShelfButtons } from "@/components/books/book-actions";
import { BookGrid } from "@/components/books/book-grid";
import { ReportButton } from "@/components/moderation/report-button";
import { BOOK_LEVEL_LABEL, type BookLevelKey } from "@/lib/content";
import { plural, timeAgo } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Libro", robots: { index: false }, alternates: { canonical: `/libros/${(await params).slug}` } };
}

export default async function LibroPage({ params }: Props) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{2,120}$/.test(slug)) notFound();
  const { profile } = await requireOnboardedMember();
  const book = await getBook(slug, profile.id);
  if (!book) notFound();
  const related = await relatedBooks(book);
  const isStaff = profile.role === "admin" || profile.role === "moderator";
  const canWrite = profile.role !== "restricted";
  const othersRecommended = book.recommendations.some((r) => r.user_id !== profile.id);
  const canEditBook = isStaff || (book.created_by === profile.id && !othersRecommended && canWrite);
  const levels = book.recommendations.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.level]: (acc[r.level] ?? 0) + 1 }), {});

  return (
    <article className="max-w-5xl">
      <p className="mb-6 text-sm">
        <Link href="/libros" className="link-draw text-muted hover:text-accent">
          ← Biblioteca
        </Link>
      </p>

      <header className="grid gap-8 sm:grid-cols-[11rem_1fr] md:grid-cols-[13rem_1fr] md:gap-12">
        <div className="mx-auto w-40 sm:mx-0 sm:w-full">
          <BookCover title={book.title} authors={book.authors} slug={book.slug} url={book.cover_url} size="lg" />
        </div>
        <div className="min-w-0 animate-rise">
          {book.area && (
            <Link href={`/libros?area=${book.area.slug}`} className="label hover:text-accent">
              {book.area.name}
            </Link>
          )}
          <h1 className="display mt-3 break-words text-[clamp(2rem,5vw,3.4rem)] !leading-[1.06] text-ink">{book.title}</h1>
          <p className="mt-3 font-serif text-xl text-ink-2">
            {book.authors}
            {book.year ? <span className="text-muted"> · {book.year}</span> : null}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            <Stars value={book.avg_rating} count={book.rating_count} />
            <span>{plural(book.rec_count, "recomendación", "recomendaciones")}</span>
            {book.shelfCounts.want > 0 && <span>{book.shelfCounts.want} quieren leerlo</span>}
            {book.shelfCounts.read > 0 && <span>{book.shelfCounts.read} lo han leído</span>}
            {book.isbn && <span className="font-mono text-xs">ISBN {book.isbn}</span>}
          </div>
          {Object.keys(levels).length > 0 && (
            <p className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(levels).map(([k, n]) => (
                <span key={k} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-ink-2">
                  {BOOK_LEVEL_LABEL[k as BookLevelKey]} · {n}
                </span>
              ))}
            </p>
          )}
          {book.topics.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {book.topics.map((t) => (
                <li key={t.id}>
                  <Link href={`/libros?tema=${t.id}`} className="tag">
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-7">
            <ShelfButtons bookId={book.id} initial={book.shelf} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {canWrite && !book.mine && (
              <a href="#recomendar" className="btn btn-primary btn-sm">
                Recomendar este libro
              </a>
            )}
            {canEditBook && (
              <Link href={`/libros/${book.slug}/editar`} className="btn btn-ghost btn-sm">
                Corregir la ficha
              </Link>
            )}
            <ReportButton targetType="book" targetId={book.id} label="Denunciar ficha" compact />
          </div>
        </div>
      </header>

      <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="recs">
          <h2 id="recs" className="font-serif text-2xl text-ink">
            Por qué lo recomiendan
          </h2>
          {book.recommendations.length ? (
            <ul className="mt-5 border-t hairline">
              {book.recommendations.map((r) => {
                const name = r.author?.display_name ?? r.author?.username ?? "Miembro";
                const own = r.user_id === profile.id;
                return (
                  <li key={r.id} id={`r-${r.id}`} className="scroll-mt-24 border-b hairline py-6">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
                      <Link href={`/miembros/${r.author?.username}`} className="flex items-center gap-2 hover:text-accent">
                        <Avatar url={r.author?.avatar_url} name={name} size={28} />
                        <span className="text-ink">{name}</span>
                      </Link>
                      <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-ink-2">{BOOK_LEVEL_LABEL[r.level]}</span>
                      {r.rating && <Stars value={r.rating} />}
                      <span>{timeAgo(r.created_at)}</span>
                      {r.edited_at && <span>· editada</span>}
                    </div>
                    <p className="mt-3 whitespace-pre-line font-serif text-[1.0625rem] leading-relaxed text-ink-2">{r.body}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <HelpfulButton recId={r.id} initial={r.helpful_mine} count={r.helpful_count} disabled={own} />
                      {!own && <ReportButton targetType="book_recommendation" targetId={r.id} compact />}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-5 border-t hairline py-6 font-serif text-lg text-muted">Nadie lo ha recomendado todavía.</p>
          )}

          {canWrite && (
            <div className="mt-12 rounded-sm border border-line-2 p-5 sm:p-7">
              <h2 className="mb-6 font-serif text-xl text-ink">{book.mine ? "Tu recomendación" : "Recomendar este libro"}</h2>
              <RecommendationForm
                bookId={book.id}
                initial={book.mine ? { id: book.mine.id, body: book.mine.body, level: book.mine.level, rating: book.mine.rating } : null}
              />
            </div>
          )}
        </section>

        <aside className="space-y-8">
          {related.length > 0 && (
            <div>
              <h2 className="label mb-4">Relacionados</h2>
              <BookGrid books={related} empty={null} narrow />
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
