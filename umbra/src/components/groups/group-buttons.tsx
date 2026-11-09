"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelCircleRequestAction,
  joinCircleAction,
  leaveCircleAction,
  leaveProjectAction,
  removeCircleMemberAction,
  requestProjectAction,
  respondCircleInviteAction,
  respondCircleRequestAction,
  respondProjectRequestAction,
  setCircleRoleAction,
} from "@/app/(app)/actions/groups";
import { ConfirmButton } from "@/components/ui/confirm-button";

type R = { ok: boolean; message?: string };

function useRun() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<R>, after?: () => void) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r.ok) after?.();
      else setError(r.message ?? "No se pudo completar.");
    });
  return { pending, error, run };
}

/** Unirse / solicitar / salir de un círculo. */
export function CircleMembershipButton({
  circleId,
  visibility,
  role,
  requestPending,
  inviteId,
}: {
  circleId: string;
  visibility: "public" | "private" | "invite";
  role: "owner" | "admin" | "member" | null;
  requestPending: boolean;
  inviteId: string | null;
}) {
  const { pending, error, run } = useRun();
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);

  let content: React.ReactNode;
  if (role === "owner") content = <span className="label text-accent">Creaste este círculo</span>;
  else if (role)
    content = (
      <ConfirmButton className="btn btn-ghost btn-sm" confirmLabel="Salir del círculo" onConfirm={() => leaveCircleAction(circleId)}>
        Eres miembro · Salir
      </ConfirmButton>
    );
  else if (inviteId)
    content = (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-2">Te han invitado.</span>
        <button type="button" disabled={pending} className="btn btn-primary btn-sm" onClick={() => run(() => respondCircleInviteAction(inviteId, true))}>
          Aceptar invitación
        </button>
        <button type="button" disabled={pending} className="btn btn-quiet btn-sm" onClick={() => run(() => respondCircleInviteAction(inviteId, false))}>
          Rechazar
        </button>
      </div>
    );
  else if (requestPending)
    content = (
      <div className="flex items-center gap-2">
        <span className="btn btn-ghost btn-sm pointer-events-none !text-muted">Solicitud enviada</span>
        <button type="button" disabled={pending} className="btn btn-quiet btn-sm" onClick={() => run(() => cancelCircleRequestAction(circleId))}>
          Retirar
        </button>
      </div>
    );
  else if (visibility === "public")
    content = (
      <button type="button" disabled={pending} className="btn btn-primary" onClick={() => run(() => joinCircleAction(circleId))}>
        {pending ? "Uniéndote…" : "Unirse al círculo"}
      </button>
    );
  else if (visibility === "private")
    content = asking ? (
      <div className="w-full max-w-md space-y-2">
        <label htmlFor="circle-note" className="label block">
          Preséntate (opcional)
        </label>
        <textarea
          id="circle-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          rows={2}
          className="boxed w-full p-3 text-[0.9375rem] outline-none"
        />
        <div className="flex gap-2">
          <button type="button" disabled={pending} className="btn btn-primary btn-sm" onClick={() => run(() => joinCircleAction(circleId, note))}>
            Enviar solicitud
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setAsking(false)}>
            Cancelar
          </button>
        </div>
      </div>
    ) : (
      <button type="button" className="btn btn-primary" onClick={() => setAsking(true)}>
        Solicitar acceso
      </button>
    );
  else content = <span className="label">Solo por invitación</span>;

  return (
    <div className="flex flex-col items-start gap-2">
      {content}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Aceptar / rechazar una solicitud (círculo o proyecto). */
export function RequestDecision({ kind, requestId }: { kind: "circle" | "project"; requestId: string }) {
  const { pending, error, run } = useRun();
  const [done, setDone] = useState<string | null>(null);
  const router = useRouter();
  const finish = (label: string) => {
    setDone(label);
    // Deja ver la confirmación y después actualiza miembros y solicitudes.
    setTimeout(() => router.refresh(), 1500);
  };
  if (done) return <span className="label text-accent">{done}</span>;
  const respond = kind === "circle" ? respondCircleRequestAction : respondProjectRequestAction;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} className="btn btn-primary btn-sm" onClick={() => run(() => respond(requestId, true), () => finish("Aceptada"))}>
        Aceptar
      </button>
      <button type="button" disabled={pending} className="btn btn-quiet btn-sm" onClick={() => run(() => respond(requestId, false), () => finish("Rechazada"))}>
        Rechazar
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

/** Gestión de un miembro del círculo (rol y expulsión). */
export function CircleMemberControls({
  circleId,
  memberId,
  role,
  canPromote,
  canRemove,
}: {
  circleId: string;
  memberId: string;
  role: "owner" | "admin" | "member";
  canPromote: boolean;
  canRemove: boolean;
}) {
  const { pending, error, run } = useRun();
  return (
    <div className="flex flex-wrap items-center gap-1">
      {canPromote && role !== "owner" && (
        <button
          type="button"
          disabled={pending}
          className="icon-btn"
          onClick={() => run(() => setCircleRoleAction(circleId, memberId, role === "admin" ? "member" : "admin"))}
        >
          {role === "admin" ? "Quitar administración" : "Hacer administrador"}
        </button>
      )}
      {canRemove && role !== "owner" && (
        <ConfirmButton confirmLabel="Retirar del círculo" onConfirm={() => removeCircleMemberAction(circleId, memberId)}>
          Retirar
        </ConfirmButton>
      )}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

/** Solicitar colaboración en un proyecto / salir. */
export function ProjectMembershipButton({
  projectId,
  role,
  request,
}: {
  projectId: string;
  role: "owner" | "collaborator" | null;
  request: string | null;
}) {
  const { pending, error, run } = useRun();
  const [state, setState] = useState(request);
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");

  if (role === "owner") return <span className="label text-accent">Tu proyecto</span>;
  if (role)
    return (
      <ConfirmButton className="btn btn-ghost btn-sm" confirmLabel="Dejar el proyecto" onConfirm={() => leaveProjectAction(projectId)}>
        Participas · Salir
      </ConfirmButton>
    );
  if (state === "pending" || state === "declined")
    return <span className="btn btn-ghost btn-sm pointer-events-none !text-muted">Solicitud enviada</span>;
  if (asking)
    return (
      <div className="w-full max-w-md space-y-2">
        <label htmlFor="project-note" className="label block">
          ¿Cómo te gustaría colaborar?
        </label>
        <textarea
          id="project-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={600}
          rows={3}
          className="boxed w-full p-3 text-[0.9375rem] outline-none"
          placeholder="Tengo experiencia con tierra cruda y puedo ir los fines de semana…"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            className="btn btn-primary btn-sm"
            onClick={() => run(() => requestProjectAction(projectId, note), () => setState("pending"))}
          >
            Enviar solicitud
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setAsking(false)}>
            Cancelar
          </button>
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      </div>
    );
  return (
    <button type="button" className="btn btn-primary" onClick={() => setAsking(true)}>
      Quiero colaborar
    </button>
  );
}

/** Retirar a alguien de un proyecto (solo su creador). */
export function ProjectMemberRemove({ projectId, memberId }: { projectId: string; memberId: string }) {
  return (
    <ConfirmButton confirmLabel="Retirar del proyecto" onConfirm={() => leaveProjectAction(projectId, memberId)}>
      Retirar
    </ConfirmButton>
  );
}
