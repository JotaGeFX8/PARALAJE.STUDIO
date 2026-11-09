import { redirect } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { allForums } from "@/lib/data/admin";
import { CategoryForm, ForumForm } from "@/components/admin/controls";

export default async function ForosAdminPage() {
  const { profile } = await requireOnboardedMember();
  if (profile.role !== "admin") redirect("/admin");
  const forums = await allForums();
  const options = forums.map((f) => ({ slug: f.slug, name: f.name }));
  return (
    <>
      <p className="mb-8 max-w-2xl text-[0.9375rem] text-ink-2">
        Los foros organizan las conversaciones; cada uno tiene normas propias y subcategorías. Archivar un foro o una
        subcategoría la oculta de los listados sin borrar sus publicaciones. Mover una subcategoría de foro mueve también
        sus publicaciones.
      </p>
      <div className="space-y-14">
        {forums.map((f) => (
          <section key={f.slug} className="border-t hairline pt-6">
            <ForumForm initial={f} />
            <h3 className="label mb-1 mt-8">Subcategorías de {f.name}</h3>
            <div className="border-t hairline">
              {f.categories.map((c) => (
                <CategoryForm key={c.slug} initial={c} forums={options} forum={f.slug} />
              ))}
              <CategoryForm forums={options} forum={f.slug} />
            </div>
          </section>
        ))}
        <section className="border-t hairline pt-6">
          <h2 className="label mb-4">Nuevo foro</h2>
          <ForumForm />
        </section>
      </div>
    </>
  );
}
