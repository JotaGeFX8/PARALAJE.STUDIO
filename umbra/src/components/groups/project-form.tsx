"use client";

import { useActionState, useState, useTransition } from "react";
import { saveProjectAction } from "@/app/(app)/actions/groups";
import { initialFormState } from "@/lib/form-state";
import { PROJECT_STATUS } from "@/lib/content";
import { FormMessage } from "@/components/forms/fields";
import { TopicMultiSelect } from "@/components/forms/topic-multiselect";
import type { Catalog } from "@/lib/data/catalog";
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
  area_slug?: string | null;
  topics?: number[];
  skills?: number[];
  coverUrl?: string | null;
};

export function ProjectForm({ catalog, initial = {} }: { catalog: Catalog; initial?: Initial }) {
  const [state, formAction] = useActionState(saveProjectAction, initialFormState);
  const [cover, setCover] = useState<File | null>(null);
  const [pending, start] = useTransition();
  const [area, setArea] = useState(initial.area_slug ?? "");
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
      <div>
        <label htmlFor="p-area" className="label block">
          Área principal
        </label>
        <select id="p-area" name="area" value={area} onChange={(ev) => setArea(ev.target.value)} className="field">
          <option value="">Sin área</option>
          {catalog.areas.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name}
            </option>
          ))}
        </select>
        {e.area && <p className="mt-2 text-sm text-danger">{e.area}</p>}
      </div>
      <TopicMultiSelect
        name="topics"
        label="Temáticas"
        areas={catalog.areas}
        topics={catalog.topics}
        initial={initial.topics ?? []}
        max={8}
        preferArea={area || null}
        hint="De qué trata el proyecto. Ayuda a que lo encuentren las personas interesadas."
        error={e.topics}
      />
      <TopicMultiSelect
        name="skills"
        label="Conocimientos que necesitáis"
        areas={catalog.areas}
        topics={catalog.topics}
        initial={initial.skills ?? []}
        max={12}
        hint="Se recomendará el proyecto a quien diga que puede enseñar o tiene experiencia en estos temas."
        error={e.skills}
      />
      <CoverPicker currentUrl={initial.coverUrl} onFile={setCover} error={e.cover} />
      <div className="flex justify-end border-t hairline pt-6">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Guardando…" : initial.id ? "Guardar cambios" : "Publicar proyecto"}
        </button>
      </div>
    </form>
  );
}
