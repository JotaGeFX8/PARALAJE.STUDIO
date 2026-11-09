import Link from "next/link";
import type { BookCard } from "@/lib/data/books";
import { SHELF_LABEL } from "@/lib/content";
import { BookCover, Stars } from "./book-cover";

export function BookGrid({ books, empty, narrow = false }: { books: BookCard[]; empty: React.ReactNode; narrow?: boolean }) {
  if (!books.length) return <div className="border-t hairline py-10 font-serif text-lg leading-relaxed text-muted">{empty}</div>;
  return (
    <ul className={`grid grid-cols-2 gap-x-5 gap-y-10 ${narrow ? "" : "sm:grid-cols-3 lg:grid-cols-4"}`}>
      {books.map((b) => (
        <li key={b.id}>
          <Link href={`/libros/${b.slug}`} className="group block">
            <BookCover title={b.title} authors={b.authors} slug={b.slug} url={b.cover_url} className="transition-transform duration-500 group-hover:-translate-y-1" />
            <p className="mt-3 line-clamp-2 font-serif text-[1.0625rem] leading-snug text-ink group-hover:text-accent">{b.title}</p>
            <p className="mt-0.5 line-clamp-1 text-sm text-muted">
              {b.authors}
              {b.year ? ` · ${b.year}` : ""}
            </p>
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Stars value={b.avg_rating} />
            <span className="text-xs text-muted">
              {b.rec_count} {b.rec_count === 1 ? "recomendación" : "recomendaciones"}
            </span>
          </div>
          {(b.my_shelf || b.my_rec) && (
            <p className="mt-1.5 text-xs text-accent-strong">
              {b.my_rec ? "Lo recomiendas" : ""}
              {b.my_rec && b.my_shelf ? " · " : ""}
              {b.my_shelf ? SHELF_LABEL[b.my_shelf] : ""}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
