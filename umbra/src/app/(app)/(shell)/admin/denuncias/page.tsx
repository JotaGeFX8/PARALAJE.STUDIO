import Link from "next/link";
import { listReports } from "@/lib/data/admin";
import { requireOnboardedMember } from "@/lib/auth";
import { NavTabs } from "@/components/ui/nav-tabs";
import { ModButton } from "@/components/admin/controls";
import {
  modDeleteCircleAction,
  modDeleteCommentAction,
  modDeleteMessageAction,
  modDeletePostAction,
  modDeleteProjectAction,
  modDeleteBookAction,
  modDeleteBookRecommendationAction,
  resolveReportAction,
  setStatusAction,
} from "@/app/(app)/actions/admin";
import { REPORT_REASONS } from "@/lib/content";
import { oneParam, timeAgo } from "@/lib/format";

const TARGET = {
  post: "Publicación",
  comment: "Comentario",
  profile: "Perfil",
  message: "Mensaje",
  circle: "Círculo",
  project: "Proyecto",
  book: "Libro",
  book_recommendation: "Recomendación de libro",
} as const;

export default async function DenunciasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { profile } = await requireOnboardedMember();
  const raw = oneParam((await searchParams).estado);
  const status = raw === "resolved" || raw === "dismissed" ? raw : "open";
  const reports = await listReports(status);
  const reason = Object.fromEntries(REPORT_REASONS.map((r) => [r.key, r.label]));

  return (
    <>
      <NavTabs
        label="Estado"
        active={status}
        items={[
          { key: "open", label: "Abiertas", href: "/admin/denuncias" },
          { key: "resolved", label: "Resueltas", href: "/admin/denuncias?estado=resolved" },
          { key: "dismissed", label: "Descartadas", href: "/admin/denuncias?estado=dismissed" },
        ]}
      />
      {reports.length === 0 ? (
        <p className="py-10 font-serif text-lg text-muted">{status === "open" ? "No hay denuncias pendientes." : "Nada por aquí."}</p>
      ) : (
        <ul className="mt-2">
          {reports.map((r) => {
            const p = r.preview;
            const del =
              r.target_type === "post"
                ? modDeletePostAction.bind(null, r.target_id)
                : r.target_type === "comment"
                  ? modDeleteCommentAction.bind(null, r.target_id)
                  : r.target_type === "message"
                    ? modDeleteMessageAction.bind(null, r.target_id)
                    : r.target_type === "circle"
                      ? modDeleteCircleAction.bind(null, r.target_id)
                      : r.target_type === "project"
                        ? modDeleteProjectAction.bind(null, r.target_id)
                        : r.target_type === "book"
                          ? modDeleteBookAction.bind(null, r.target_id)
                          : r.target_type === "book_recommendation"
                            ? modDeleteBookRecommendationAction.bind(null, r.target_id)
                            : null;
            return (
              <li key={r.id} className="border-b hairline py-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-medium text-danger">{reason[r.reason]}</span>
                  <span className="text-ink">{TARGET[r.target_type]}</span>
                  <span className="text-muted">
                    denunciado por {r.reporter?.display_name ?? r.reporter?.username ?? "cuenta eliminada"} · {timeAgo(r.created_at)}
                  </span>
                </div>
                {r.details && <p className="mt-2 text-[0.9375rem] italic text-ink-2">«{r.details}»</p>}
                <div className="mt-3 rounded-xl bg-surface-2 p-4">
                  {p ? (
                    <>
                      <p className="text-sm font-medium text-ink">
                        {p.title} {p.author_username && <span className="font-normal text-muted">· @{p.author_username}</span>}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">{p.body || "—"}</p>
                      {p.link && (
                        <Link href={p.link} className="link mt-2 inline-block text-sm">
                          Ver en contexto
                        </Link>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted">El contenido ya no existe.</p>
                  )}
                </div>
                {status === "open" ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {del && p && <ModButton label="Retirar contenido" confirmLabel="Retirar" askReason danger action={del} />}
                    {p?.author_id && p.author_id !== profile.id && (
                      <ModButton
                        label="Suspender autor"
                        confirmLabel="Suspender"
                        askReason
                        danger
                        action={setStatusAction.bind(null, p.author_id, "suspended")}
                      />
                    )}
                    <ModButton label="Marcar resuelta" confirmLabel="Resolver" askReason action={resolveReportAction.bind(null, r.id, "resolved")} />
                    <ModButton label="Descartar" confirmLabel="Descartar" askReason action={resolveReportAction.bind(null, r.id, "dismissed")} />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    {status === "resolved" ? "Resuelta" : "Descartada"} por {r.resolver?.display_name ?? r.resolver?.username ?? "—"}
                    {r.resolution_note && ` — ${r.resolution_note}`}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
