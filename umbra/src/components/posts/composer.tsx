"use client";

import { useActionState, useId, useRef, useState, useTransition } from "react";
import { createPostAction, updatePostAction } from "@/app/(app)/actions/posts";
import { initialFormState } from "@/lib/form-state";
import { EPISTEMIC_KINDS, type PostKind } from "@/lib/content";
import { downscaleImage } from "@/lib/images";
import { FormMessage } from "@/components/forms/fields";
import { IconClose, IconImage, IconPlus } from "@/components/ui/icons";

type Category = { slug: string; name: string };

export type ComposerInitial = {
  postId?: string;
  category?: string | null;
  title?: string | null;
  body?: string;
  kind?: PostKind;
  is_question?: boolean;
  sources?: string[];
  tags?: string[];
  images?: { path: string; url: string }[];
};

const MAX_IMAGES = 4;
const MAX_TOTAL_BYTES = 3.8 * 1024 * 1024; // margen bajo el límite de la plataforma

/**
 * Editor de publicaciones para foros, Ágora y círculos.
 * - mode "create" | "edit"
 * - categories: si se pasa, permite elegir territorio (o Ágora).
 * - circle: id del círculo cuando se publica dentro de uno.
 */
export function Composer({
  mode,
  categories,
  initial = {},
  circle,
  lockCategory = false,
}: {
  mode: "create" | "edit";
  categories?: Category[];
  initial?: ComposerInitial;
  circle?: string;
  lockCategory?: boolean;
}) {
  const [state, formAction] = useActionState(mode === "create" ? createPostAction : updatePostAction, initialFormState);
  const [pending, start] = useTransition();
  const [category, setCategory] = useState(initial.category ?? "");
  const [kind, setKind] = useState<PostKind>(initial.kind ?? "opinion");
  const [sources, setSources] = useState<string[]>(initial.sources?.length ? initial.sources : [""]);
  const [tags, setTags] = useState((initial.tags ?? []).join(", "));
  const [kept, setKept] = useState(initial.images ?? []);
  const [added, setAdded] = useState<{ file: File; url: string }[]>([]);
  const [imgError, setImgError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const ids = { title: useId(), body: useId(), tags: useId(), cat: useId() };
  const errors = state.errors ?? {};
  const forum = Boolean(category) && !circle;
  const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setImgError(null);
    const room = MAX_IMAGES - kept.length - added.length;
    const list = Array.from(files).slice(0, Math.max(room, 0));
    if (files.length > room) setImgError(`Máximo ${MAX_IMAGES} imágenes por publicación.`);
    setProcessing(true);
    try {
      const out: { file: File; url: string }[] = [];
      for (const f of list) {
        if (f.size > 15 * 1024 * 1024) {
          setImgError("Alguna imagen supera los 15 MB.");
          continue;
        }
        const blob = await downscaleImage(f, { max: 1600 });
        const file = new File([blob], `${f.name.replace(/\.\w+$/, "")}.webp`, { type: "image/webp" });
        out.push({ file, url: URL.createObjectURL(blob) });
      }
      setAdded((a) => [...a, ...out]);
    } catch {
      setImgError("No se pudo procesar la imagen. Usa JPG, PNG o WebP.");
    } finally {
      setProcessing(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.delete("images");
    const total = added.reduce((n, a) => n + a.file.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      setImgError("Las imágenes ocupan demasiado. Quita alguna.");
      return;
    }
    for (const a of added) fd.append("images", a.file);
    start(() => formAction(fd));
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-10">
      {initial.postId && <input type="hidden" name="post_id" value={initial.postId} />}
      {circle && <input type="hidden" name="circle" value={circle} />}
      {kept.map((k) => (
        <input key={k.path} type="hidden" name="keep_images" value={k.path} />
      ))}
      <FormMessage message={state.message} />

      {/* Dónde */}
      {categories && !circle && (
        <div>
          <label htmlFor={ids.cat} className="label block">
            Dónde publicar
          </label>
          <select
            id={ids.cat}
            name="category"
            value={category}
            disabled={lockCategory}
            onChange={(e) => setCategory(e.target.value)}
            className="field"
          >
            <option value="">Ágora · conversación libre</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          {lockCategory && <input type="hidden" name="category" value={category} />}
        </div>
      )}

      {/* Título */}
      <div>
        <label htmlFor={ids.title} className="label block">
          Título {forum ? "" : "· opcional"}
        </label>
        <input
          id={ids.title}
          name="title"
          defaultValue={state.values?.title ?? initial.title ?? ""}
          maxLength={160}
          aria-invalid={errors.title ? true : undefined}
          className="field font-serif !text-2xl"
          placeholder={forum ? "Una pregunta, una idea, un hallazgo…" : "Sin título también vale"}
        />
        {errors.title && <p className="mt-2 text-sm text-danger">{errors.title}</p>}
      </div>

      {/* Tipo de aportación */}
      <fieldset>
        <legend className="label mb-3">¿Qué tipo de aportación es?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {EPISTEMIC_KINDS.map((k) => (
            <label
              key={k.key}
              className={`flex cursor-pointer gap-3 rounded-sm border p-3.5 transition-colors ${
                kind === k.key ? "border-accent-mid bg-accent-faint" : "border-line-2 hover:border-accent-mid"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={k.key}
                checked={kind === k.key}
                onChange={() => setKind(k.key)}
                className="mt-1"
              />
              <span>
                <span className="block text-[0.9375rem] font-medium text-ink">{k.name}</span>
                <span className="mt-0.5 block text-[0.8125rem] leading-snug text-muted">{k.description}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.kind && <p className="mt-2 text-sm text-danger">{errors.kind}</p>}
        <label className="mt-4 flex cursor-pointer items-center gap-3 text-[0.9375rem] text-ink-2">
          <input type="checkbox" name="is_question" defaultChecked={initial.is_question} />
          Es una pregunta abierta a la comunidad
        </label>
      </fieldset>

      {/* Texto */}
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={ids.body} className="label block">
            Texto
          </label>
          <details className="text-xs text-muted">
            <summary className="cursor-pointer select-none">Formato</summary>
            <p className="mt-2 leading-relaxed">
              **negrita** · *cursiva* · &gt; cita · - lista · 1. lista · `código` · enlaces y @menciones automáticos
            </p>
          </details>
        </div>
        <textarea
          id={ids.body}
          name="body"
          defaultValue={state.values?.body ?? initial.body ?? ""}
          maxLength={20000}
          rows={9}
          aria-invalid={errors.body ? true : undefined}
          className="field !text-[1.0625rem] leading-relaxed"
          placeholder="Desarrolla tu idea. Si citas datos, añade las fuentes abajo."
        />
        {errors.body && <p className="mt-2 text-sm text-danger">{errors.body}</p>}
      </div>

      {/* Fuentes */}
      <fieldset>
        <legend className="label mb-1">Fuentes {kind === "documented" ? "· obligatorias" : "· opcionales"}</legend>
        <p className="mb-3 text-sm text-muted">Enlaces, libros o artículos que sostienen lo que cuentas.</p>
        <div className="space-y-2">
          {sources.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                name="sources"
                value={s}
                maxLength={500}
                onChange={(e) => setSources((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
                className="field"
                placeholder="https://… o «Autor, Título, año»"
                aria-label={`Fuente ${i + 1}`}
              />
              {sources.length > 1 && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setSources((arr) => arr.filter((_, j) => j !== i))}
                  aria-label={`Quitar fuente ${i + 1}`}
                >
                  <IconClose size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        {sources.length < 12 && (
          <button type="button" className="icon-btn mt-2 -ml-2" onClick={() => setSources((a) => [...a, ""])}>
            <IconPlus size={16} /> Añadir fuente
          </button>
        )}
        {errors.sources && <p className="mt-2 text-sm text-danger">{errors.sources}</p>}
      </fieldset>

      {/* Etiquetas */}
      <div>
        <label htmlFor={ids.tags} className="label block">
          Etiquetas · hasta 5, separadas por comas
        </label>
        <input
          id={ids.tags}
          name="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="field"
          placeholder="permacultura, adobe, energía solar"
        />
        {tagList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tagList.slice(0, 5).map((t) => (
              <span key={t} className="tag">
                #{t}
              </span>
            ))}
          </div>
        )}
        {errors.tags && <p className="mt-2 text-sm text-danger">{errors.tags}</p>}
      </div>

      {/* Imágenes */}
      <div>
        <p className="label mb-3">Imágenes · opcional, hasta {MAX_IMAGES}</p>
        <div className="flex flex-wrap gap-3">
          {kept.map((k) => (
            <Thumb key={k.path} url={k.url} onRemove={() => setKept((a) => a.filter((x) => x.path !== k.path))} />
          ))}
          {added.map((a, i) => (
            <Thumb
              key={a.url}
              url={a.url}
              onRemove={() => {
                URL.revokeObjectURL(a.url);
                setAdded((arr) => arr.filter((_, j) => j !== i));
              }}
            />
          ))}
          {kept.length + added.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={processing}
              className="grid h-24 w-24 place-items-center rounded-sm border border-dashed border-line-2 text-muted transition-colors hover:border-accent-mid hover:text-accent"
            >
              <span className="flex flex-col items-center gap-1 text-xs">
                <IconImage size={22} />
                {processing ? "Procesando…" : "Añadir"}
              </span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          name="images"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label="Seleccionar imágenes"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {(imgError || errors.images) && <p className="mt-2 text-sm text-danger">{imgError ?? errors.images}</p>}
        <p className="mt-2 text-xs text-muted">Se reducen a 1600 px y se elimina la información de ubicación.</p>
      </div>

      <div className="flex items-center justify-end gap-3 border-t hairline pt-6">
        <button type="submit" className="btn btn-primary" disabled={pending || processing} aria-busy={pending}>
          {pending ? "Publicando…" : mode === "create" ? "Publicar" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

function Thumb({ url, onRemove }: { url: string; onRemove: () => void }) {
  return (
    <div className="relative h-24 w-24 overflow-hidden rounded-sm border border-line">
      {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Quitar imagen"
        className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-surface/90 text-ink shadow"
      >
        <IconClose size={14} />
      </button>
    </div>
  );
}
