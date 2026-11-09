import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOnboardedMember } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { AREAS, EPISTEMIC_KINDS } from "@/lib/content";

export const metadata: Metadata = { title: "Comunidad" };

export default async function ComunidadPage() {
  await requireOnboardedMember();
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("slug, name, description")
    .order("position");

  return (
    <>
      <PageHeader eyebrow="Comunidad · Foros" title="Territorios" lead={AREAS[1].description} />

      <p className="mb-12 border-l-2 border-moss-2 bg-graphite px-5 py-4 text-sm leading-relaxed text-stone-2">
        <span className="label mr-2 text-lichen">Fase 3</span>
        Los territorios ya existen; las publicaciones, comentarios, reacciones y etiquetas se abrirán en la
        próxima fase de desarrollo. Cada aportación declarará si es{" "}
        {EPISTEMIC_KINDS.map((k, i) => (
          <span key={k.key}>
            {i > 0 && (i === EPISTEMIC_KINDS.length - 1 ? " o " : ", ")}
            <strong className="font-medium text-bone">{k.name.toLowerCase()}</strong>
          </span>
        ))}
        .
      </p>

      <ol className="border-t hairline">
        {(categories ?? []).map((c, i) => (
          <li key={c.slug} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b hairline py-6 md:grid-cols-[3rem_18rem_1fr] md:items-baseline md:gap-8">
            <span className="font-mono text-xs text-stone">{String(i + 1).padStart(2, "0")}</span>
            <h2 className="font-serif text-xl text-bone md:text-2xl">{c.name}</h2>
            <p className="col-start-2 mt-1 text-[0.9375rem] leading-relaxed text-stone md:col-start-auto md:mt-0">
              {c.description}
            </p>
          </li>
        ))}
      </ol>
    </>
  );
}
