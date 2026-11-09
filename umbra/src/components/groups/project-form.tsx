"use client";

import { useActionState, useState, useTransition } from "react";
import { saveProjectAction } from "@/app/(app)/actions/groups";
import { initialFormState } from "@/lib/form-state";
import { PROJECT_STATUS } from "@/lib/content";
import { FormMessage } from "@/components/forms/fields";
import { CoverPicker } from "./cover-picker";

type Initial = {
  id?: string;
  title?: string;
  summary?: string;
  description?: string;
  objectives?: string[];
  seeking?: string;
  status?: keyof typeof PROJECT_STATUS;
  country?: string | null;
  region?: string | null;
  interests?: string[];
  coverUrl?: string | null;
};

export function ProjectForm({ interests, initial = {} }: { interests: { slug: string; name: string }[]; initial?: Initial }) {
  const [state, formAction] = useActionState(saveProjectAction, initialFormState);
  const [cover, setCover] = useState<File | null>(null);
  const [pending, start] = useTransition();
  const [chosen, setChosen] = useState<string[]>(initial.interests ?? []);
  const e = state.errors ?? {};
  const v = state.values ?? {};

  return (
    <form
      noValidate
      className="space-y-9"
      onSubmit={(ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        fd.delete("cover");
        if (cover) fd.append("cover", cover);
        start(() => formAction(fd));
      }}
    >
      {initial.id && <input type="hidden" name="project_id" value={initial.id} />}
      {chosen.map((c) => (
        <input key={c} type="hidden" name="interests" value={c} />
      ))}
      <FormMessage message={state.message} />

      <div>
        <label htmlFor="p-title" className="label block">
          Nombre del proyecto
        </label>
        <input
          id="p-title"
          name="title"
          defaultValue={v.title ?? initial.title}
          maxLength={100}
          aria-invalid={e.title ? true : undefined}
          className="field font-serif !text-2xl"
          placeholder="Casa de paja en el valle, Huerto comunitario de barrio…"
        />
        {e.title && <p className="mt-2 text-sm text-danger">{e.title}</p>}
      </div>
      <div>
        <label htmlFor="p-summary" className="label block">
          Resumen en una frase
        </label>
        <input id="p-summary" name="summary" defaultValue={v.summary ?? initial.summary} maxLength={280} className="field" />
        {e.summary && <p className="mt-2 text-sm text-danger">{e.summary}</p>}
      </div>
      <div>
        <label htmlFor="p-desc" className="label block">
          Descripción
        </label>
        <textarea
          id="p-desc"
          name="description"
          defaultValue={v.description ?? initial.description}
          maxLength={10000}
          rows={7}
          className="field"
          placeholder="Contexto, punto de partida, recursos con los que contáis…"
        />
        {e.description && <p className="mt-2 text-sm text-danger">{e.description}</p>}
      </div>
      <div>
        <label htmlFor="p-obj" className="label block">
          Objetivos · uno por línea
        </label>
        <textarea
          id="p-obj"
          name="objectives"
          defaultValue={(initial.objectives ?? []).join("\n")}
          rows={4}
          className="field"
          placeholder={"Levantar los muros antes del invierno\nInstalar placas solares\nDocumentar el proceso"}
        />
        {e.objectives && <p className="mt-2 text-sm text-danger">{e.objectives}</p>}
      </div>
      <div>
        <label htmlFor="p-seek" className="label block">
          Qué ayuda buscáis
        </label>
        <textarea
          id="p-seek"
          name="seeking"
          defaultValue={v.seeking ?? initial.seeking}
          maxLength={600}
          rows={3}
          className="field"
          placeholder="Manos para la obra, alguien con conocimientos de electricidad solar…"
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <label htmlFor="p-status" className="label block">
            Estado
          </label>
          <select id="p-status" name="status" defaultValue={initial.status ?? "idea"} className="field">
            {(Object.keys(PROJECT_STATUS) as (keyof typeof PROJECT_STATUS)[]).map((k) => (
              <option key={k} value={k}>
                {PROJECT_STATUS[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="p-country" className="label block">
            País · opcional
          </label>
          <input id="p-country" name="country" defaultValue={initial.country ?? ""} maxLength={60} className="field" />
        </div>
        <div>
          <label htmlFor="p-region" className="label block">
            Región · opcional
          </label>
          <input id="p-region" name="region" defaultValue={initial.region ?? ""} maxLength={80} className="field" />
        </div>
      </div>
      <p className="-mt-6 text-xs text-muted">Solo una localización aproximada: nunca direcciones ni coordenadas.</p>
      <fieldset>
        <legend className="label mb-3">Temáticas · hasta 6</legend>
        <div className="flex flex-wrap gap-1.5">
          {interests.map((it) => (
            <button
              key={it.slug}
              type="button"
              className="chip !min-h-8 !px-3 !text-[0.8125rem]"
              aria-pressed={chosen.includes(it.slug)}
              disabled={!chosen.includes(it.slug) && chosen.length >= 6}
              onClick={() => setChosen((c) => (c.includes(it.slug) ? c.filter((x) => x !== it.slug) : [...c, it.slug]))}
            >
              {it.name}
            </button>
          ))}
        </div>
        {e.interests && <p className="mt-2 text-sm text-danger">{e.interests}</p>}
      </fieldset>
      <CoverPicker currentUrl={initial.coverUrl} onFile={setCover} error={e.cover} />
      <div className="flex justify-end border-t hairline pt-6">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Guardando…" : initial.id ? "Guardar cambios" : "Publicar proyecto"}
        </button>
      </div>
    </form>
  );
}
