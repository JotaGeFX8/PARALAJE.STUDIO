import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { listMembers } from "@/lib/data/admin";
import { Avatar } from "@/components/ui/avatar";
import { RoleControl, StatusControl } from "@/components/admin/controls";
import { oneParam, timeAgo } from "@/lib/format";
import type { Enums } from "@/lib/supabase/types";

const STATUS = { active: "Activa", suspended: "Suspendida", banned: "Cerrada" } as const;
const ROLES = { admin: "Administración", moderator: "Moderación", member: "Usuario", restricted: "Restringido" } as const;

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { profile } = await requireOnboardedMember();
  const isAdmin = profile.role === "admin";
  const sp = await searchParams;
  const q = oneParam(sp.q).slice(0, 80);
  const roleRaw = oneParam(sp.rol);
  const statusRaw = oneParam(sp.estado);
  const role = (roleRaw in ROLES ? roleRaw : null) as Enums<"user_role"> | null;
  const status = (statusRaw in STATUS ? statusRaw : null) as Enums<"account_status"> | null;
  const members = await listMembers(q, role, status);

  return (
    <>
      <form action="/admin/usuarios" className="mb-6 grid gap-4 sm:grid-cols-[1fr_12rem_12rem_auto] sm:items-end">
        <div>
          <label htmlFor="uq" className="label block">
            Buscar {isAdmin ? "(nombre, usuario o correo)" : "(nombre o usuario)"}
          </label>
          <input id="uq" name="q" defaultValue={q} className="field" />
        </div>
        <div>
          <label htmlFor="ur" className="label block">
            Rol
          </label>
          <select id="ur" name="rol" defaultValue={role ?? ""} className="field">
            <option value="">Todos</option>
            {Object.entries(ROLES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ue" className="label block">
            Estado
          </label>
          <select id="ue" name="estado" defaultValue={status ?? ""} className="field">
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-ghost btn-sm">
          Filtrar
        </button>
      </form>

      <ul className="border-t hairline">
        {members.map((m) => {
          const name = m.display_name ?? m.username ?? "Sin perfil";
          const self = m.id === profile.id;
          return (
            <li key={m.id} className="grid gap-3 border-b hairline py-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex items-center gap-4">
                <Avatar url={m.avatar_url} name={name} size={42} />
                <div className="min-w-0">
                  <p className="text-ink">
                    {m.username ? (
                      <Link href={`/miembros/${m.username}`} className="hover:text-accent">
                        {name}
                      </Link>
                    ) : (
                      name
                    )}{" "}
                    <span className="font-mono text-xs text-muted">{m.username ? `@${m.username}` : "(sin completar)"}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {m.email && <span>{m.email} · </span>}
                    alta {timeAgo(m.created_at)} · {Number(m.posts)} publicaciones
                    {Number(m.reports_against) > 0 && <span className="text-danger"> · {Number(m.reports_against)} denuncias</span>}
                    {" · "}
                    <span className={m.status === "active" ? "" : "text-danger"}>{STATUS[m.status]}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {isAdmin ? <RoleControl userId={m.id} role={m.role} disabled={self} /> : <span className="label">{ROLES[m.role]}</span>}
                {!self && (isAdmin || (m.role !== "admin" && m.role !== "moderator")) && (
                  <StatusControl userId={m.id} status={m.status} canBan={isAdmin} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {members.length === 0 && <p className="py-8 text-muted">Ningún usuario coincide.</p>}
    </>
  );
}
