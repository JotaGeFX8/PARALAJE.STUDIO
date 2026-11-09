"use client";

import { useRef, useState, useTransition } from "react";
import { removeAvatarAction, uploadAvatarAction } from "@/app/(app)/profile-actions";
import { downscaleImage } from "@/lib/images";
import { Avatar } from "@/components/ui/avatar";

const MAX_INPUT_BYTES = 15 * 1024 * 1024;

/**
 * Foto de perfil: se recorta y reduce a 512 px WebP en el navegador (sin EXIF)
 * y la sube el servidor a la carpeta propia del usuario.
 */
export function AvatarUploader({ initialUrl, name }: { userId?: string; initialUrl: string | null; name: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  function handle(file: File) {
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError("Usa una imagen JPG, PNG o WebP.");
    if (file.size > MAX_INPUT_BYTES) return setError("La imagen supera los 15 MB.");
    start(async () => {
      try {
        const blob = await downscaleImage(file, { max: 512, square: true, quality: 0.86 });
        const fd = new FormData();
        fd.append("avatar", new File([blob], "avatar.webp", { type: "image/webp" }));
        const res = await uploadAvatarAction(fd);
        if (!res.ok || !res.url) throw new Error(res.message);
        setUrl(res.url);
      } catch (e) {
        setError((e as Error).message || "No se pudo subir la imagen. Inténtalo de nuevo.");
      }
    });
  }

  function remove() {
    setError(null);
    start(async () => {
      const res = await removeAvatarAction();
      if (!res.ok) return setError(res.message ?? "No se pudo quitar la imagen.");
      setUrl(null);
    });
  }

  return (
    <div className="flex items-center gap-5">
      <Avatar url={url} name={name || "?"} size={76} className={pending ? "opacity-50" : ""} />
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => input.current?.click()}>
            {pending ? "Procesando…" : url ? "Cambiar foto" : "Añadir foto"}
          </button>
          {url && (
            <button type="button" className="btn btn-quiet btn-sm" disabled={pending} onClick={remove}>
              Quitar
            </button>
          )}
        </div>
        <p className="text-xs text-muted">Opcional. JPG, PNG o WebP. Se recorta a 512 px y se elimina la ubicación.</p>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-label="Seleccionar foto de perfil"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) handle(f);
        }}
      />
    </div>
  );
}
