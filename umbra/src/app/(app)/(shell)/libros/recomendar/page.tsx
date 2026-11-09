import type { Metadata } from "next";
import { requireOnboardedMember } from "@/lib/auth";
import { getCatalog } from "@/lib/data/catalog";
import { PageHeader } from "@/components/ui/page-header";
import { BookForm } from "@/components/books/book-form";

export const metadata: Metadata = { title: "Recomendar un libro" };

export default async function RecomendarLibroPage() {
  const { profile } = await requireOnboardedMember();
  if (profile.role === "restricted") {
    return <PageHeader eyebrow="Biblioteca" title="Recomendación restringida" lead="Tu cuenta puede leer la biblioteca, pero no recomendar libros por ahora." />;
  }
  const catalog = await getCatalog();
  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Biblioteca"
        title="Recomendar un libro"
        lead="Si el libro ya está en la biblioteca, te lo indicaremos para que añadas tu recomendación a su ficha."
      />
      <BookForm mode="new" catalog={catalog} />
    </div>
  );
}
