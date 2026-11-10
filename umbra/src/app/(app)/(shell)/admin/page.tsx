import Link from "next/link";
import { adminStats, moderationLog } from "@/lib/data/admin";
import { timeAgo } from "@/lib/format";

export default async function AdminPage() {
  const [s, log] = await Promise.all([adminStats(), moderationLog(20)]);
  const figures = [
    { label: "Miembros", value: s.members, note: `+${s.membersWeek} esta semana` },
    { label: "Publicaciones", value: s.posts, note: `+${s.postsWeek} esta semana` },
    { label: "Comentarios", value: s.comments },
    { label: "Círculos", value: s.circles },
    { label: "Proyectos", value: s.projects },
    { label: "Denuncias abiertas", value: s.openReports, href: "/admin/denuncias", alert: s.openReports > 0 },
    { label: "Cuentas suspendidas o cerradas", value: s.suspended, href: "/admin/usuarios?estado=suspended" },
  ];
  return (
    <div className="space-y-14">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border hairline bg-line sm:grid-cols-3 lg:grid-cols-4">
        {figures.map((f) => {
          const inner = (
            <>
              <dt className="label">{f.label}</dt>
              <dd className={`mt-3 font-serif text-4xl ${f.alert ? "text-danger" : "text-ink"}`}>{f.value.toLocaleString("es")}</dd>
              {f.note && <dd className="mt-1 text-xs text-muted">{f.note}</dd>}
            </>
          );
          return (
            <div key={f.label} className="bg-canvas">
              {f.href ? (
                <Link href={f.href} className="block p-5 transition-colors hover:bg-surface-2">
                  {inner}
                </Link>
              ) : (
                <div className="p-5">{inner}</div>
              )}
            </div>
          );
        })}
      </dl>

      <section>
        <h2 className="label mb-3">Registro de moderación</h2>
        {log.length ? (
          <ul className="border-t hairline">
            {log.map((a) => (
              <li key={a.id} className="grid gap-1 border-b hairline py-3 text-sm sm:grid-cols-[10rem_1fr_auto]">
                <span className="text-muted">{timeAgo(a.created_at)}</span>
                <span className="text-ink-2">
                  <span className="font-medium text-ink">{a.actor?.display_name ?? a.actor?.username ?? "Sistema"}</span> · {a.action} ·{" "}
                  {a.target_type}
                  {a.note && <span className="text-muted"> — {a.note}</span>}
                </span>
                <span className="font-mono text-xs text-muted">{a.target_id.slice(0, 8)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Sin acciones registradas todavía.</p>
        )}
      </section>
    </div>
  );
}
