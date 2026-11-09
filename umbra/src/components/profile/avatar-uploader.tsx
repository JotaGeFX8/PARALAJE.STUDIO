"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { setAvatarAction } from "@/app/(app)/profile-actions";
import { Avatar } from "@/components/ui/avatar";

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const TARGET = 512;

/**
 * Sube el avatar directamente a Supabase Storage (carpeta propia, protegida
 * por RLS), tras reducirlo a 512 px en WebP en el propio navegador.
 */
export function AvatarUploader({ userId, initialUrl, name }: { userId: string; initialUrl: string | null; name: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError("Usa una imagen JPG, PNG o WebP.");
    if (file.size > MAX_INPUT_BYTES) return setError("La imagen supera los 8 MB.");

    start(async () => {
      try {
        const blob = await downscale(file);
        const supabase = createClient();
        const path = `${userId}/${Date.now()}.webp`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
        if (upErr) throw upErr;
        const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
        const res = await setAvatarAction(publicUrl);
        if (!res.ok) throw new Error(res.message);
        await cleanup(supabase, userId, path);
        setUrl(publicUrl);
      } catch (err) {
        console.error("avatar", err);
        setError("No se pudo subir la imagen. Inténtalo de nuevo.");
      }
    });
  }

  function remove() {
    setError(null);
    start(async () => {
      const res = await setAvatarAction(null);
      if (!res.ok) return setError(res.message ?? "No se pudo quitar la imagen.");
      await cleanup(createClient(), userId, null);
      setUrl(null);
    });
  }

  return (
    <div className="flex items-center gap-5">
      <Avatar url={url} name={name || "?"} size={76} className={pending ? "opacity-50" : ""} />
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost min-h-10 px-4 text-sm" disabled={pending} onClick={() => input.current?.click()}>
            {pending ? "Procesando…" : url ? "Cambiar foto" : "Añadir foto"}
          </button>
          {url && (
            <button type="button" className="btn btn-quiet min-h-10 text-sm" disabled={pending} onClick={remove}>
              Quitar
            </button>
          )}
        </div>
        <p className="text-xs text-stone">Opcional. JPG, PNG o WebP. Se recorta a 512 px.</p>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
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

/** Recorte cuadrado centrado y reducción a WebP. Elimina metadatos EXIF (incluida la ubicación). */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const size = Math.min(TARGET, side);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.86));
  if (!blob || blob.size > 2 * 1024 * 1024) throw new Error("blob");
  return blob;
}

/** Borra avatares antiguos de la carpeta propia para no acumular almacenamiento. */
async function cleanup(supabase: ReturnType<typeof createClient>, userId: string, keep: string | null) {
  const { data } = await supabase.storage.from("avatars").list(userId, { limit: 100 });
  const stale = (data ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== keep);
  if (stale.length) await supabase.storage.from("avatars").remove(stale);
}
