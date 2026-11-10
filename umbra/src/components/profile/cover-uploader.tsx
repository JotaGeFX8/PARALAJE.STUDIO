"use client";

import { useRef, useState, useTransition } from "react";
import { removeProfileCoverAction, uploadProfileCoverAction } from "@/app/(app)/profile-actions";
import { downscaleImage } from "@/lib/images";
import { coverUrl } from "@/lib/media";
import { IconImage } from "@/components/ui/icons";

/** Portada del perfil: se reduce en el navegador (sin EXIF) y se sube al momento. */
export function CoverUploader({ initialPath }: { initialPath: string | null }) {
  const [url, setUrl] = useState(coverUrl(initialPath));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  function handle(file: File) {
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError("Usa una imagen JPG, PNG o WebP.");
    if (file.size > 15 * 1024 * 1024) return setError("La imagen supera los 15 MB.");
    start(async () => {
      try {
        const blob = await downscaleImage(file, { max: 1600 });
        const fd = new FormData();
        fd.append("cover", new File([blob], "portada.webp", { type: "image/webp" }));
        const res = await uploadProfileCoverAction(fd);
        if (!res.ok || !res.path) throw new Error(res.message);
        setUrl(coverUrl(res.path));
      } catch (e) {
        setError((e as Error).message || "No se pudo subir la portada.");
      }
    });
  }

  return (
    <div>
      <p className="label mb-3">Portada · opcional</p>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={pending}
        className="relative flex aspect-[3/1] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-line-2 bg-surface-2 text-muted transition-colors hover:border-accent-mid hover:text-accent"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagen servida desde /media
          <img src={url} alt="Portada actual" className={`absolute inset-0 h-full w-full object-cover ${pending ? "opacity-50" : ""}`} />
        ) : (
          <span className="flex flex-col items-center gap-2 text-sm">
            <IconImage size={26} />
            {pending ? "Procesando…" : "Añadir una imagen de portada"}
          </span>
        )}
      </button>
      <div className="mt-2 flex gap-2">
        {url && (
          <>
            <button type="button" className="btn btn-quiet btn-sm -ml-3" disabled={pending} onClick={() => input.current?.click()}>
              Cambiar portada
            </button>
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await removeProfileCoverAction();
                  if (!r.ok) setError(r.message ?? "No se pudo quitar la portada.");
                  else setUrl(null);
                })
              }
            >
              Quitar
            </button>
          </>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-label="Seleccionar imagen de portada"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) handle(f);
        }}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
