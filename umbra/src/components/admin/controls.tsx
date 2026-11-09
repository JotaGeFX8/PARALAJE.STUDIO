"use client";

import { useActionState, useState, useTransition } from "react";
import {
  reclassifyPostAction,
  saveCategoryAction,
  saveForumAction,
  saveSettingsAction,
  setPostFlagsAction,
  setRoleAction,
  setStatusAction,
} from "@/app/(app)/actions/admin";
import { initialFormState } from "@/lib/form-state";
import { EPISTEMIC_KINDS } from "@/lib/content";
import { FormMessage, SubmitButton } from "@/components/forms/fields";
import type { Enums } from "@/lib/supabase/types";

type R = { ok: boolean; message?: string };

/**
 * Acción de moderación con motivo opcional y confirmación.
 * `action` recibe el motivo escrito (queda en el registro y, si procede, se notifica).
 */
export function ModButton({
  label,
  confirmLabel = "Confirmar",
  action,
  askReason = false,
  danger = false,
}: {
  label: string;
  confirmLabel?: string;
  action: (reason: string) => Promise<R>;
  askReason?: boolean;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<R | null>(null);
  const [pending, start] = useTransition();
  if (state?.ok) return <span className="label text-accent">Hecho</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {open ? (
        <>
          {askReason && (
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo (se registra)"
              aria-label="Motivo"
              maxLength={500}
              className="field !w-56 !py-1.5 !text-sm"
            />
          )}
          <button
            type="button"
            disabled={pending}
            className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={() => start(async () => setState(await action(reason)))}
          >
            {pending ? "…" : confirmLabel}
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setOpen(false)}>
            Cancelar
          </button>
        </>
      ) : (
        <button type="button" className={`btn btn-sm ${danger ? "btn-danger" : "btn-ghost"}`} onClick={() => setOpen(true)}>
          {label}
        </button>
      )}
      {state && !state.ok && <span className="text-xs text-danger">{state.message}</span>}
    </span>
  );
}

const ROLE_LABEL = { admin: "Administración", moderator: "Moderación", member: "Usuario", restricted: "Restringido" } as const;

export function RoleControl({ userId, role, disabled }: { userId: string; role: Enums<"user_role">; disabled?: boolean }) {
  const [value, setValue] = useState(role);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex items-center gap-2">
      <select
        aria-label="Rol"
        value={value}
        disabled={disabled || pending}
        className="field !w-auto !py-1 !text-sm"
        onChange={(e) => {
          const next = e.target.value as Enums<"user_role">;
          const prev = value;
          setValue(next);
          start(async () => {
            const r = await setRoleAction(userId, next);
            if (!r.ok) {
              setValue(prev);
              setMsg(r.message ?? "Error");
            } else setMsg("Guardado");
          });
        }}
      >
        {(Object.keys(ROLE_LABEL) as Enums<"user_role">[]).map((k) => (
          <option key={k} value={k}>
            {ROLE_LABEL[k]}
          </option>
        ))}
      </select>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </span>
  );
}

export function StatusControl({ userId, status, canBan }: { userId: string; status: Enums<"account_status">; canBan: boolean }) {
  if (status !== "active") {
    return <ModButton label="Reactivar" confirmLabel="Reactivar cuenta" action={(r) => setStatusAction(userId, "active", r)} />;
  }
  return (
    <span className="inline-flex flex-wrap gap-2">
      <ModButton label="Suspender" confirmLabel="Suspender" askReason danger action={(r) => setStatusAction(userId, "suspended", r)} />
      {canBan && <ModButton label="Expulsar" confirmLabel="Expulsar" askReason danger action={(r) => setStatusAction(userId, "banned", r)} />}
    </span>
  );
}

export function PostFlags({ postId, locked, pinned }: { postId: string; locked: boolean; pinned: boolean }) {
  const [state, setState] = useState({ locked, pinned });
  const [pending, start] = useTransition();
  const toggle = (k: "locked" | "pinned") => {
    const next = { ...state, [k]: !state[k] };
    setState(next);
    start(async () => {
      const r = await setPostFlagsAction(postId, next.locked, next.pinned);
      if (!r.ok) setState(state);
    });
  };
  return (
    <span className="inline-flex gap-1">
      <button type="button" disabled={pending} aria-pressed={state.pinned} className="icon-btn" onClick={() => toggle("pinned")}>
        {state.pinned ? "Desfijar" : "Fijar"}
      </button>
      <button type="button" disabled={pending} aria-pressed={state.locked} className="icon-btn" onClick={() => toggle("locked")}>
        {state.locked ? "Reabrir" : "Cerrar"}
      </button>
    </span>
  );
}

export function Reclassify({ postId, kind }: { postId: string; kind: Enums<"post_kind"> }) {
  const [value, setValue] = useState(kind);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <select aria-label="Clasificación" value={value} onChange={(e) => setValue(e.target.value as Enums<"post_kind">)} className="field !w-auto !py-1 !text-sm">
        {EPISTEMIC_KINDS.map((k) => (
          <option key={k.key} value={k.key}>
            {k.name}
          </option>
        ))}
      </select>
      {value !== kind && (
        <ModButton label="Reclasificar" confirmLabel="Aplicar" askReason action={(r) => reclassifyPostAction(postId, value, r)} />
      )}
    </span>
  );
}

export function CategoryForm({
  initial,
  forums,
  forum,
}: {
  initial?: { slug: string; name: string; description: string; position: number; is_archived: boolean };
  forums: { slug: string; name: string }[];
  forum: string;
}) {
  const [state, action] = useActionState(saveCategoryAction, initialFormState);
  return (
    <form action={action} className="grid gap-3 border-b hairline py-5 md:grid-cols-[8rem_12rem_1fr_9rem_4rem_auto_auto] md:items-end">
      <label className="block">
        <span className="label block">Id</span>
        <input name="slug" defaultValue={initial?.slug} readOnly={Boolean(initial)} className="field !text-sm" placeholder="nueva-subcategoria" />
      </label>
      <label className="block">
        <span className="label block">Nombre</span>
        <input name="name" defaultValue={initial?.name} maxLength={80} className="field !text-sm" />
      </label>
      <label className="block">
        <span className="label block">Descripción</span>
        <input name="description" defaultValue={initial?.description} maxLength={400} className="field !text-sm" />
      </label>
      <label className="block">
        <span className="label block">Foro</span>
        <select name="forum" defaultValue={forum} className="field !text-sm">
          {forums.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label block">Orden</span>
        <input name="position" type="number" defaultValue={initial?.position ?? 99} className="field !text-sm" />
      </label>
      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input type="checkbox" name="archived" defaultChecked={initial?.is_archived} /> Archivada
      </label>
      <div className="flex items-center gap-2">
        <SubmitButton className="btn btn-ghost btn-sm" pendingLabel="…">
          {initial ? "Guardar" : "Crear"}
        </SubmitButton>
        {(state.message || state.errors) && (
          <span className={`text-xs ${state.ok ? "text-accent" : "text-danger"}`}>
            {state.message ?? state.errors?.name ?? state.errors?.slug}
          </span>
        )}
      </div>
    </form>
  );
}

/** Edición de un foro: nombre, descripción, normas (una por línea), orden y archivo. */
export function ForumForm({
  initial,
}: {
  initial?: { slug: string; name: string; description: string; rules: string; position: number; is_archived: boolean };
}) {
  const [state, action] = useActionState(saveForumAction, initialFormState);
  return (
    <form action={action} className="grid gap-4 md:grid-cols-[8rem_1fr_5rem] md:items-start">
      <label className="block">
        <span className="label block">Id</span>
        <input name="slug" defaultValue={initial?.slug} readOnly={Boolean(initial)} className="field !text-sm" placeholder="nuevo-foro" />
      </label>
      <div className="grid gap-4">
        <label className="block">
          <span className="label block">Nombre</span>
          <input name="name" defaultValue={initial?.name} maxLength={80} className="field font-serif !text-lg" />
        </label>
        <label className="block">
          <span className="label block">Descripción</span>
          <input name="description" defaultValue={initial?.description} maxLength={400} className="field !text-sm" />
        </label>
        <label className="block">
          <span className="label block">Normas · una por línea</span>
          <textarea name="rules" defaultValue={initial?.rules} maxLength={4000} rows={4} className="field !text-sm" />
        </label>
      </div>
      <div className="grid gap-4">
        <label className="block">
          <span className="label block">Orden</span>
          <input name="position" type="number" defaultValue={initial?.position ?? 99} className="field !text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" name="archived" defaultChecked={initial?.is_archived} disabled={initial?.slug === "agora"} /> Archivado
        </label>
      </div>
      <div className="flex items-center gap-3 md:col-start-2">
        <SubmitButton className="btn btn-ghost btn-sm" pendingLabel="…">
          {initial ? "Guardar foro" : "Crear foro"}
        </SubmitButton>
        {(state.message || state.errors) && (
          <span className={`text-xs ${state.ok ? "text-accent" : "text-danger"}`}>
            {state.message ?? state.errors?.name ?? state.errors?.slug}
          </span>
        )}
      </div>
    </form>
  );
}

export function SettingsForm({ registrationOpen, welcome }: { registrationOpen: boolean; welcome: string }) {
  const [state, action] = useActionState(saveSettingsAction, initialFormState);
  return (
    <form action={action} className="max-w-2xl space-y-7">
      <FormMessage message={state.message} tone={state.ok ? "ok" : "error"} />
      <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] text-ink-2">
        <input type="checkbox" name="registration_open" defaultChecked={registrationOpen} className="mt-1" />
        <span>
          <span className="block font-medium text-ink">Registro abierto</span>
          Si lo desactivas, nadie podrá crear cuentas nuevas (ni siquiera llamando a la API directamente).
        </span>
      </label>
      <div>
        <label htmlFor="welcome" className="label block">
          Mensaje de bienvenida (aparece en Explorar a los nuevos miembros)
        </label>
        <textarea id="welcome" name="welcome_message" defaultValue={welcome} maxLength={600} rows={4} className="field" />
      </div>
      <SubmitButton className="btn btn-primary" pendingLabel="Guardando…">
        Guardar configuración
      </SubmitButton>
    </form>
  );
}
