import { requireOnboardedMember } from "@/lib/auth";
import { getCatalog, pendingTopics } from "@/lib/data/catalog";
import { CatalogTools, TopicReview } from "@/components/admin/topic-controls";
import { EmptyState } from "@/components/ui/section";
import { timeAgo } from "@/lib/format";

export default async function TemasAdminPage() {
  const { profile } = await requireOnboardedMember();
  const isAdmin = profile.role === "admin";
  const [catalog, pending] = await Promise.all([getCatalog(), pendingTopics()]);
  const areaName = new Map(catalog.areas.map((a) => [a.slug, a.name]));
  const approved = catalog.topics.filter((t) => !t.pending);

  return (
    <>
      <p className="mb-8 max-w-2xl text-[0.9375rem] text-ink-2">
        Catálogo de {catalog.areas.length} áreas y {approved.length} temas. Las propuestas de los miembros se usan en su propio
        perfil desde el primer momento y aparecen para todos cuando se aprueban. Rechazar una la retira de los perfiles.
      </p>

      <section aria-labelledby="pendientes" className="mb-14">
        <h2 id="pendientes" className="label mb-3">
          Propuestas pendientes · {pending.length}
        </h2>
        {pending.length ? (
          <ul className="border-t hairline">
            {pending.map((t) => (
              <li key={t.id} className="grid gap-4 border-b hairline py-5 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <p className="font-serif text-xl text-ink">{t.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    Propuesto en {areaName.get(t.area_slug) ?? t.area_slug}
                    {t.proposer?.username && <> por @{t.proposer.username}</>} · {timeAgo(t.created_at)}
                  </p>
                </div>
                <TopicReview topic={t} areas={catalog.areas} topics={approved} canMerge={isAdmin} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No hay temas pendientes de revisar.</EmptyState>
        )}
      </section>

      <section aria-labelledby="herramientas">
        <h2 id="herramientas" className="label mb-5">
          Herramientas del catálogo
        </h2>
        <CatalogTools areas={catalog.areas} topics={approved} canMerge={isAdmin} />
      </section>
    </>
  );
}
