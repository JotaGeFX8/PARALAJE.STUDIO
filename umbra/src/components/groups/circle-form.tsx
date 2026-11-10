"use client";

import { useActionState, useState, useTransition } from "react";
import { createCircleAction, inviteToCircleAction, updateCircleAction } from "@/app/(app)/actions/groups";
import { initialFormState } from "@/lib/form-state";
import { VISIBILITY } from "@/lib/content";
import { FormMessage, SubmitButton } from "@/components/forms/fields";
import { CoverPicker } from "./cover-picker";

type Initial = {
  id?: string;
  name?: string;
  description?: string;
  visibility?: keyof typeof VISIBILITY;
  coverUrl?: string | null;
};

export function CircleForm({ initial = {} }: { initial?: Initial }) {
  const editing = Boolean(initial.id);
  const [state, formAction] = useActionState(editing ? updateCircleAction : createCircleAction, initialFormState);
  const [cover, setCover] = useState<File | null>(null);
  const [visibility, setVisibility] = useState(initial.visibility ?? "public");
  const [pending, start] = useTransition();
  const e = state.errors ?? {};

  return (
    <form
      noValidate
      className="space-y-8"
      onSubmit={(ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        fd.delete("cover");
        if (cover) fd.append("cover", cover);
        start(() => formAction(fd));
      }}
    >
      {initial.id && <input type="hidden" name="circle_id" value={initial.id} />}
      <FormMessage message={state.message} tone={state.ok ? "ok" : "error"} />
      <div>
        <label htmlFor="c-name" className="label block">
          Nombre
        </label>
        <input
          id="c-name"
          name="name"
          defaultValue={state.values?.name ?? initial.name}
          maxLength={80}
          aria-invalid={e.name ? true : undefined}
          className="field font-serif !text-2xl"
          placeholder="Astronomía de patio, Casas de paja del norte…"
        />
        {e.name && <p className="mt-2 text-sm text-danger">{e.name}</p>}
      </div>
      <div>
        <label htmlFor="c-desc" className="label block">
          Descripción
        </label>
        <textarea
          id="c-desc"
          name="description"
          defaultValue={state.values?.description ?? initial.description}
          maxLength={2000}
          rows={5}
          className="field"
          placeholder="Qué hacéis, a quién buscáis, cómo os organizáis."
        />
        {e.description && <p className="mt-2 text-sm text-danger">{e.description}</p>}
      </div>
      <fieldset>
        <legend className="label mb-3">Visibilidad</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(VISIBILITY) as (keyof typeof VISIBILITY)[]).map((k) => (
            <label
              key={k}
              className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors ${
                visibility === k ? "border-accent-mid bg-accent-faint" : "border-line-2 hover:border-accent-mid"
              }`}
            >
              <input type="radio" name="visibility" value={k} checked={visibility === k} onChange={() => setVisibility(k)} className="mt-1" />
              <span>
                <span className="block text-[0.9375rem] font-medium text-ink">{VISIBILITY[k].label}</span>
                <span className="mt-0.5 block text-[0.8125rem] leading-snug text-muted">{VISIBILITY[k].hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <CoverPicker currentUrl={initial.coverUrl} onFile={setCover} error={e.cover} />
      <div className="flex justify-end border-t hairline pt-6">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Guardando…" : editing ? "Guardar cambios" : "Crear círculo"}
        </button>
      </div>
    </form>
  );
}

export function InviteForm({ circleId }: { circleId: string }) {
  const [state, action] = useActionState(inviteToCircleAction, initialFormState);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="circle_id" value={circleId} />
      <label htmlFor="invite-user" className="label block">
        Invitar por nombre de usuario
      </label>
      <div className="flex items-end gap-2">
        <input id="invite-user" name="username" placeholder="@usuario" className="field" autoComplete="off" />
        <SubmitButton className="btn btn-ghost btn-sm" pendingLabel="Invitando…">
          Invitar
        </SubmitButton>
      </div>
      {state.errors?.username && <p className="text-sm text-danger">{state.errors.username}</p>}
      {state.ok && <p className="text-sm text-accent">{state.message}</p>}
    </form>
  );
}
