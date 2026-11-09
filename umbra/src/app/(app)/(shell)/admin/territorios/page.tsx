import { redirect } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { allCategories } from "@/lib/data/admin";
import { CategoryForm } from "@/components/admin/controls";

export default async function TerritoriosAdminPage() {
  const { profile } = await requireOnboardedMember();
  if (profile.role !== "admin") redirect("/admin");
  const categories = await allCategories();
  return (
    <>
      <p className="mb-6 max-w-2xl text-[0.9375rem] text-ink-2">
        Edita los territorios del foro. Archivar uno lo oculta del listado sin borrar sus publicaciones.
      </p>
      <div className="border-t hairline">
        {categories.map((c) => (
          <CategoryForm key={c.slug} initial={c} />
        ))}
      </div>
      <h2 className="label mb-1 mt-10">Nuevo territorio</h2>
      <CategoryForm />
    </>
  );
}
