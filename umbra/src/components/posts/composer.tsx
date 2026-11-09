"use client";

import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { createPostAction, discardUploadAction, suggestTagsAction, updatePostAction } from "@/app/(app)/actions/posts";
import { initialFormState } from "@/lib/form-state";
import { DEFAULT_KIND_FOR_TYPE, EPISTEMIC_KINDS, POST_TYPES, type PostKind, type PostTypeKey } from "@/lib/content";
import { ATTACHMENT_TYPES, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS } from "@/lib/validation/posts";
import { downscaleImage } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";
import { FormMessage } from "@/components/forms/fields";
import { fileSize } from "@/lib/format";
import { IconClose, IconFile, IconImage, IconPlus } from "@/components/ui/icons";

type ForumOption = { slug: string; name: string; categories: { slug: string; name: string }[] };

export type ComposerInitial = {
  postId?: string;
  forum?: string | null;
  category?: string | null;
  title?: string | null;
  body?: string;
  type?: PostTypeKey;
  kind?: PostKind;
  sources?: string[];
  tags?: string[];
  images?: { path: string; url: string }[];
  attachments?: { id: string; name: string; size: number }[];
  hasPoll?: boolean;
};

type Uploaded = { path: string; name: string; mime: string; size: number };

const MAX_IMAGES = 4;
const MAX_TOTAL_BYTES = 3.8 * 1024 * 1024; // margen bajo el límite de las acciones del servidor
const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  epub: "application/epub+zip",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/**
 * Editor de publicaciones para foros, Ágora y círculos.
 * - forums: si se pasa, permite elegir foro y subcategoría.
 * - circle: id del círculo cuando se publica dentro de uno.
 */
export function Composer({
  mode,
  userId,
  forums,
  initial = {},
  circle,
  lockForum = false,
}: {
  mode: "create" | "edit";
  userId: string;
  forums?: ForumOption[];
  initial?: ComposerInitial;
  circle?: string;
  lockForum?: boolean;
}) {
  const [state, formAction] = useActionState(mode === "create" ? createPostAction : updatePostAction, initialFormState);
  const [pending, start] = useTransition();
  const [forum, setForum] = useState(initial.forum ?? (circle ? "" : "agora"));
  const [category, setCategory] = useState(initial.category ?? "");
  const [type, setType] = useState<PostTypeKey>(initial.type ?? "debate");
  const [kind, setKind] = useState<PostKind>(initial.kind ?? "opinion");
  const [kindTouched, setKindTouched] = useState(mode === "edit");
  const [sources, setSources] = useState<string[]>(initial.sources?.length ? initial.sources : [""]);
  const [tags, setTags] = useState((initial.tags ?? []).join(", "));
  const [kept, setKept] = useState(initial.images ?? []);
  const [added, setAdded] = useState<{ file: File; url: string }[]>([]);
  const [imgError, setImgError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [keptFiles, setKeptFiles] = useState(initial.attachments ?? []);
  const [uploads, setUploads] = useState<Uploaded[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const ids = { title: useId(), body: useId(), tags: useId(), forum: useId(), cat: useId(), days: useId() };
  const errors = state.errors ?? {};
  const currentForum = forums?.find((f) => f.slug === forum);
  const titleRequired = !circle && forum !== "agora";
  const pollLocked = mode === "edit";
  const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

  function chooseType(t: PostTypeKey) {
    setType(t);
    // Propone la clasificación habitual del tipo mientras no se haya elegido a mano.
    if (!kindTouched) setKind(DEFAULT_KIND_FOR_TYPE[t] ?? "opinion");
  }

  async function addImages(files: FileList | null) {
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

  /** Los archivos se suben directamente al almacenamiento (carpeta propia; las políticas lo garantizan). */
  async function addDocs(files: FileList | null) {
    if (!files?.length) return;
    setFileError(null);
    const room = MAX_ATTACHMENTS - keptFiles.length - uploads.length;
    if (files.length > room) setFileError(`Máximo ${MAX_ATTACHMENTS} archivos por publicación.`);
    const supabase = createClient();
    setUploading(true);
    try {
      for (const f of Array.from(files).slice(0, Math.max(room, 0))) {
        const ext = (f.name.split(".").pop() ?? "").toLowerCase();
        const mime = f.type && f.type in ATTACHMENT_TYPES ? f.type : EXT_MIME[ext];
        if (!mime) {
          setFileError("Formatos admitidos: PDF, TXT, MD, CSV, EPUB, ODT, ODS, DOCX y XLSX.");
          continue;
        }
        if (f.size > MAX_ATTACHMENT_BYTES) {
          setFileError(`«${f.name}» supera los 10 MB.`);
          continue;
        }
        const path = `${userId}/${crypto.randomUUID()}.${ATTACHMENT_TYPES[mime]}`;
        const { error } = await supabase.storage.from("post-files").upload(path, f, { contentType: mime, upsert: false });
        if (error) {
          setFileError(`No se pudo subir «${f.name}».`);
          continue;
        }
        setUploads((u) => [...u, { path, name: f.name.slice(0, 160), mime, size: f.size }]);
      }
    } finally {
      setUploading(false);
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
      {keptFiles.map((k) => (
        <input key={k.id} type="hidden" name="keep_attachments" value={k.id} />
      ))}
      <input type="hidden" name="attachments" value={JSON.stringify(uploads)} />
      <input type="hidden" name="type" value={type} />
      <FormMessage message={state.message} />

      {/* Dónde */}
      {forums && !circle && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor={ids.forum} className="label block">
              Foro
            </label>
            <select
              id={ids.forum}
              name="forum"
              value={forum}
              disabled={lockForum}
              onChange={(e) => {
                setForum(e.target.value);
                setCategory("");
              }}
              className="field"
            >
              {forums.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.name}
                </option>
              ))}
            </select>
            {lockForum && <input type="hidden" name="forum" value={forum} />}
          </div>
          <div>
            <label htmlFor={ids.cat} className="label block">
              Subcategoría · opcional
            </label>
            <select id={ids.cat} name="category" value={category} onChange={(e) => setCategory(e.target.value)} className="field">
              <option value="">General</option>
              {(currentForum?.categories ?? []).map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Tipo */}
      <fieldset>
        <legend className="label mb-3">Tipo de publicación</legend>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {POST_TYPES.map((t) => {
            const disabled = pollLocked && (initial.hasPoll ? t.key !== "poll" : t.key === "poll");
            return (
              <label
                key={t.key}
                className={`flex cursor-pointer flex-col rounded-sm border p-3 transition-colors ${
                  type === t.key ? "border-accent-mid bg-accent-faint" : "border-line-2 hover:border-accent-mid"
                } ${disabled ? "pointer-events-none opacity-40" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type_choice"
                    value={t.key}
                    checked={type === t.key}
                    disabled={disabled}
                    onChange={() => chooseType(t.key)}
                  />
                  <span className="text-[0.9375rem] font-medium text-ink">{t.name}</span>
                </span>
                <span className="mt-1 text-[0.75rem] leading-snug text-muted">{t.description}</span>
              </label>
            );
          })}
        </div>
        {errors.type && <p className="mt-2 text-sm text-danger">{errors.type}</p>}
      </fieldset>

      {/* Título */}
      <div>
        <label htmlFor={ids.title} className="label block">
          Título {titleRequired ? "" : "· opcional"}
        </label>
        <input
          id={ids.title}
          name="title"
          defaultValue={state.values?.title ?? initial.title ?? ""}
          maxLength={160}
          aria-invalid={errors.title ? true : undefined}
          className="field font-serif !text-2xl"
          placeholder={type === "poll" ? "¿Qué quieres preguntar?" : titleRequired ? "Una pregunta, una idea, un hallazgo…" : "Sin título también vale"}
        />
        {errors.title && <p className="mt-2 text-sm text-danger">{errors.title}</p>}
      </div>

      {/* Encuesta */}
      {type === "poll" && !pollLocked && (
        <fieldset className="rounded-sm border border-line-2 p-4 sm:p-5">
          <legend className="label px-1">Opciones de la encuesta · de 2 a 10</legend>
          <div className="space-y-2">
            {pollOptions.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  name="poll_options"
                  value={o}
                  maxLength={120}
                  onChange={(e) => setPollOptions((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
                  onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  className="field"
                  placeholder={`Opción ${i + 1}`}
                  aria-label={`Opción ${i + 1}`}
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setPollOptions((arr) => arr.filter((_, j) => j !== i))}
                    aria-label={`Quitar opción ${i + 1}`}
                  >
                    <IconClose size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {pollOptions.length < 10 && (
            <button type="button" className="icon-btn mt-2 -ml-2" onClick={() => setPollOptions((a) => [...a, ""])}>
              <IconPlus size={16} /> Añadir opción
            </button>
          )}
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-3 text-[0.9375rem] text-ink-2">
              <input type="checkbox" name="poll_multiple" /> Se pueden elegir varias opciones
            </label>
            <div className="flex items-center gap-2">
              <label htmlFor={ids.days} className="text-sm text-muted">
                Cierre
              </label>
              <select id={ids.days} name="poll_days" defaultValue="7" className="field !w-auto !py-1">
                <option value="">Sin fecha</option>
                <option value="1">En 1 día</option>
                <option value="3">En 3 días</option>
                <option value="7">En 7 días</option>
                <option value="30">En 30 días</option>
              </select>
            </div>
          </div>
          {errors.poll_options && <p className="mt-2 text-sm text-danger">{errors.poll_options}</p>}
          <p className="mt-3 text-xs text-muted">Los votos son anónimos: solo se muestran los totales. Las opciones no se pueden cambiar después.</p>
        </fieldset>
      )}

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
          placeholder={type === "poll" ? "Contexto de la encuesta: por qué preguntas y qué harás con los resultados." : "Desarrolla tu idea. Si citas datos, añade las fuentes abajo."}
        />
        {errors.body && <p className="mt-2 text-sm text-danger">{errors.body}</p>}
      </div>

      {/* Clasificación */}
      <fieldset>
        <legend className="label mb-3">¿Cómo clasificas tu aportación?</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                onChange={() => {
                  setKind(k.key);
                  setKindTouched(true);
                }}
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
      </fieldset>

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
      <TagField id={ids.tags} value={tags} onChange={setTags} tagList={tagList} error={errors.tags} />

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
            addImages(e.target.files);
            e.target.value = "";
          }}
        />
        {(imgError || errors.images) && <p className="mt-2 text-sm text-danger">{imgError ?? errors.images}</p>}
        <p className="mt-2 text-xs text-muted">Se reducen a 1600 px y se elimina la información de ubicación.</p>
      </div>

      {/* Archivos */}
      <div>
        <p className="label mb-3">Archivos · opcional, hasta {MAX_ATTACHMENTS} de 10 MB</p>
        {(keptFiles.length > 0 || uploads.length > 0) && (
          <ul className="mb-3 space-y-2">
            {keptFiles.map((f) => (
              <FileLine key={f.id} name={f.name} size={f.size} onRemove={() => setKeptFiles((a) => a.filter((x) => x.id !== f.id))} />
            ))}
            {uploads.map((f) => (
              <FileLine
                key={f.path}
                name={f.name}
                size={f.size}
                onRemove={() => {
                  setUploads((a) => a.filter((x) => x.path !== f.path));
                  void discardUploadAction(f.path);
                }}
              />
            ))}
          </ul>
        )}
        {keptFiles.length + uploads.length < MAX_ATTACHMENTS && (
          <button type="button" className="btn btn-ghost btn-sm" disabled={uploading} onClick={() => docRef.current?.click()}>
            <IconFile size={16} /> {uploading ? "Subiendo…" : "Adjuntar archivo"}
          </button>
        )}
        <input
          ref={docRef}
          type="file"
          accept={[...Object.keys(ATTACHMENT_TYPES), ".md", ".csv", ".epub"].join(",")}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label="Seleccionar archivos"
          onChange={(e) => {
            addDocs(e.target.files);
            e.target.value = "";
          }}
        />
        {(fileError || errors.attachments) && <p className="mt-2 text-sm text-danger">{fileError ?? errors.attachments}</p>}
        <p className="mt-2 text-xs text-muted">PDF, texto, hojas de cálculo o EPUB. Solo los ven quienes pueden leer la publicación.</p>
      </div>

      <div className="flex items-center justify-end gap-3 border-t hairline pt-6">
        <button type="submit" className="btn btn-primary" disabled={pending || processing || uploading} aria-busy={pending}>
          {pending ? "Publicando…" : mode === "create" ? "Publicar" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

/** Etiquetas separadas por comas, con sugerencias de etiquetas en uso y temas del catálogo. */
function TagField({
  id,
  value,
  onChange,
  tagList,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  tagList: string[];
  error?: string;
}) {
  const [suggestions, setSuggestions] = useState<{ slug: string; uses: number; fromCatalog: boolean }[]>([]);
  const last = value.split(",").pop()?.trim() ?? "";
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const r = last.length >= 2 ? await suggestTagsAction(last) : [];
      if (alive) setSuggestions(r);
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [last]);
  const visible = suggestions.filter((s) => !tagList.slice(0, -1).includes(s.slug) && s.slug !== last);

  return (
    <div>
      <label htmlFor={id} className="label block">
        Etiquetas · hasta 5, separadas por comas
      </label>
      <input
        id={id}
        name="tags"
        value={value}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        className="field"
        placeholder="permacultura, adobe, energía solar"
      />
      {visible.length > 0 && last.length >= 2 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Sugerencias de etiquetas">
          <span className="text-xs text-muted">Sugerencias:</span>
          {visible.slice(0, 6).map((s) => (
            <button
              key={s.slug}
              type="button"
              className="chip !min-h-8 !px-3 !text-[0.8125rem]"
              onClick={() => {
                const parts = value.split(",").slice(0, -1).map((x) => x.trim()).filter(Boolean);
                onChange([...parts, s.slug].join(", ") + ", ");
              }}
            >
              #{s.slug}
              <span className="text-[0.6875rem] text-muted">{s.fromCatalog ? "catálogo" : s.uses}</span>
            </button>
          ))}
        </div>
      )}
      {tagList.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tagList.slice(0, 5).map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

function FileLine({ name, size, onRemove }: { name: string; size: number; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-3 rounded-sm border border-line px-3 py-2">
      <IconFile size={18} className="shrink-0 text-muted" />
      <span className="min-w-0 flex-1 truncate text-[0.9375rem] text-ink">{name}</span>
      <span className="shrink-0 font-mono text-xs text-muted">{fileSize(size)}</span>
      <button type="button" onClick={onRemove} aria-label={`Quitar ${name}`} className="icon-btn">
        <IconClose size={16} />
      </button>
    </li>
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
