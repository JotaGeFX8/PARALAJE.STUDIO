import { requireOnboardedMember } from "@/lib/auth";
import { adminTags } from "@/lib/data/admin";
import { TagRow } from "@/components/admin/tag-controls";
import { EmptyState } from "@/components/ui/section";
import { oneParam } from "@/lib/format";

export default async function EtiquetasAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireOnboardedMember();
  const q = oneParam((await searchParams).q).slice(0, 32);
  const tags = await adminTags(q);
  return (
    <>
      <p className="mb-6 max-w-2xl text-[0.9375rem] text-ink-2">
        Las etiquetas las crean los miembros al publicar. Fusiona duplicados («adobe» y «casas-de-adobe»), bloquea las que
        incumplan las normas (se retiran de las publicaciones y no se pueden volver a usar) o corrige su nombre visible. Las
        que coinciden con un tema del catálogo quedan vinculadas a él.
      </p>
      <form className="mb-6 flex max-w-md gap-2">
        <label htmlFor="tq" className="sr-only">
          Buscar etiqueta
        </label>
        <input id="tq" name="q" defaultValue={q} placeholder="Buscar etiqueta…" className="field" />
        <button type="submit" className="btn btn-ghost btn-sm">
          Buscar
        </button>
      </form>
      {tags.length ? (
        <ul className="border-t hairline">
          {tags.map((t) => (
            <TagRow key={t.slug} tag={{ ...t, uses: Number(t.uses) }} />
          ))}
        </ul>
      ) : (
        <EmptyState>{q ? "Ninguna etiqueta coincide." : "Todavía no hay etiquetas."}</EmptyState>
      )}
    </>
  );
}
