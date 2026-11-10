"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { createPhotoPostAction } from "@/app/(app)/actions/social-feed";
import { createClient } from "@/lib/supabase/client";
import { downscaleImage } from "@/lib/images";
import { IconBack, IconArrow, IconClose, IconImage } from "@/components/ui/icons";

type Shot = { file: File; url: string };
type Option = { slug: string; name: string };

const AUDIENCES = [
  { key: "members", label: "Comunidad", hint: "Cualquier miembro" },
  { key: "followers", label: "Seguidores", hint: "Solo quien te sigue" },
  { key: "connections", label: "Conexiones", hint: "Solo tus conexiones" },
] as const;

/**
 * Publicar fotos: hasta 10 por publicación (carrusel). Se reducen a 1440 px y se
 * eliminan los metadatos (ubicación incluida) en el navegador antes de subirlas.
 */
export function PhotoComposer({ userId, areas, forums }: { userId: string; areas: Option[]; forums: Option[] }) {
  const router = useRouter();
  const ids = { caption: useId(), alt: useId(), area: useId(), dest: useId(), tags: useId() };
  const input = useRef<HTMLInputElement>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [current, setCurrent] = useState(0);
  const [caption, setCaption] = useState("");
  const [alt, setAlt] = useState("");
  const [area, setArea] = useState("");
  const [dest, setDest] = useState("perfil");
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]["key"]>("members");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const room = 10 - shots.length;
    if (files.length > room) setError("Máximo 10 fotos por publicación.");
    setBusy("Preparando fotos…");
    try {
      const out: Shot[] = [];
      for (const f of Array.from(files).slice(0, Math.max(room, 0))) {
        if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
          setError("Usa fotos JPG, PNG o WebP.");
          continue;
        }
        if (f.size > 25 * 1024 * 1024) {
          setError("Alguna foto supera los 25 MB.");
          continue;
        }
        const blob = await downscaleImage(f, { max: 1440, quality: 0.85 });
        out.push({ file: new File([blob], "foto.webp", { type: "image/webp" }), url: URL.createObjectURL(blob) });
      }
      setShots((s) => [...s, ...out]);
    } catch {
      setError("No se pudo procesar alguna foto.");
    } finally {
      setBusy(null);
    }
  }

  function move(i: number, d: -1 | 1) {
    setShots((s) => {
      const j = i + d;
      if (j < 0 || j >= s.length) return s;
      const c = [...s];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
    setCurrent(i + d);
  }

  async function submit(draft: boolean) {
    if (!shots.length) return setError("Añade al menos una foto.");
    setError(null);
    const supabase = createClient();
    const paths: string[] = [];
    try {
      for (let i = 0; i < shots.length; i++) {
        setBusy(`Subiendo ${i + 1} de ${shots.length}…`);
        const path = `${userId}/${crypto.randomUUID()}.webp`;
        const { error: e } = await supabase.storage.from("post-images").upload(path, shots[i].file, { contentType: "image/webp", cacheControl: "31536000" });
        if (e) throw new Error("No se pudo subir una foto.");
        paths.push(path);
      }
      setBusy(draft ? "Guardando borrador…" : "Publicando…");
      const r = await createPhotoPostAction({
        caption,
        paths,
        area,
        audience,
        forum: dest,
        draft,
        alt,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      if (!r.ok || !r.id) throw new Error(r.message ?? "No se pudo publicar.");
      router.push(draft ? "/crear?borrador=1" : `/p/${r.id}`);
    } catch (e) {
      if (paths.length) await supabase.storage.from("post-images").remove(paths);
      setError((e as Error).message);
      setBusy(null);
    }
  }

  const sel = shots[current];
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div>
        {shots.length === 0 ? (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={Boolean(busy)}
            className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line-2 bg-surface text-muted transition-colors hover:border-accent hover:text-accent sm:aspect-square"
          >
            <IconImage size={44} />
            <span className="text-lg font-medium text-ink">{busy ?? "Elige tus fotos"}</span>
            <span className="text-sm">Hasta 10 · JPG, PNG o WebP</span>
          </button>
        ) : (
          <div>
            <div className="relative overflow-hidden rounded-2xl bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}
              <img src={sel?.url} alt="" className="aspect-[4/5] w-full object-cover" />
              <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 font-mono text-xs text-white">
                {current + 1}/{shots.length}
              </span>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {shots.map((s, i) => (
                <div key={s.url} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrent(i)}
                    aria-label={`Foto ${i + 1}`}
                    aria-pressed={i === current}
                    className={`block h-20 w-16 overflow-hidden rounded-lg border-2 ${i === current ? "border-accent" : "border-transparent"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}
                    <img src={s.url} alt="" className="h-full w-full object-cover" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Quitar foto ${i + 1}`}
                    onClick={() => {
                      URL.revokeObjectURL(s.url);
                      setShots((a) => a.filter((_, j) => j !== i));
                      setCurrent(0);
                    }}
                    className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink text-canvas"
                  >
                    <IconClose size={12} />
                  </button>
                </div>
              ))}
              {shots.length < 10 && (
                <button
                  type="button"
                  onClick={() => input.current?.click()}
                  className="grid h-20 w-16 shrink-0 place-items-center rounded-lg border border-dashed border-line-2 text-muted hover:border-accent hover:text-accent"
                  aria-label="Añadir más fotos"
                >
                  +
                </button>
              )}
            </div>
            {shots.length > 1 && (
              <div className="mt-2 flex gap-2">
                <button type="button" className="btn btn-quiet btn-sm" disabled={current === 0} onClick={() => move(current, -1)}>
                  <IconBack size={14} /> Mover antes
                </button>
                <button type="button" className="btn btn-quiet btn-sm" disabled={current === shots.length - 1} onClick={() => move(current, 1)}>
                  Mover después <IconArrow size={14} />
                </button>
              </div>
            )}
          </div>
        )}
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label="Seleccionar fotos"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor={ids.caption} className="label block">
            Pie de foto
          </label>
          <textarea
            id={ids.caption}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={2200}
            rows={5}
            className="field"
            placeholder="Cuenta qué muestran, dónde aprendiste algo, qué te preguntas…"
          />
          <p className="mt-1 text-right font-mono text-[0.6875rem] text-muted">{caption.length}/2200</p>
        </div>
        <div>
          <label htmlFor={ids.alt} className="label block">
            Descripción para lectores de pantalla · opcional
          </label>
          <input id={ids.alt} value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} className="field" placeholder="Qué se ve en las fotos" />
        </div>
        <div>
          <label htmlFor={ids.area} className="label block">
            Ámbito
          </label>
          <select id={ids.area} value={area} onChange={(e) => setArea(e.target.value)} className="field">
            <option value="">Sin ámbito</option>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={ids.dest} className="label block">
            Dónde se publica
          </label>
          <select id={ids.dest} value={dest} onChange={(e) => setDest(e.target.value)} className="field">
            <option value="perfil">Mi perfil y el feed</option>
            {forums.map((f) => (
              <option key={f.slug} value={f.slug}>
                Foro · {f.name}
              </option>
            ))}
          </select>
        </div>
        {dest === "perfil" && (
          <fieldset>
            <legend className="label mb-2">Quién puede verla</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {AUDIENCES.map((a) => (
                <label key={a.key} className="chip cursor-pointer justify-center !px-2 !text-[0.8125rem]" title={a.hint}>
                  <input type="radio" name="audience" checked={audience === a.key} onChange={() => setAudience(a.key)} className="sr-only" />
                  {a.label}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <div>
          <label htmlFor={ids.tags} className="label block">
            Etiquetas · hasta 5, separadas por comas
          </label>
          <input id={ids.tags} value={tags} onChange={(e) => setTags(e.target.value)} className="field" placeholder="cielo, astrofotografía" />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2 border-t hairline pt-5 sm:flex-row-reverse">
          <button type="button" className="btn btn-primary flex-1" disabled={Boolean(busy) || !shots.length} onClick={() => submit(false)}>
            {busy ?? "Publicar"}
          </button>
          <button type="button" className="btn btn-ghost" disabled={Boolean(busy) || !shots.length} onClick={() => submit(true)}>
            Guardar borrador
          </button>
        </div>
      </div>
    </div>
  );
}
