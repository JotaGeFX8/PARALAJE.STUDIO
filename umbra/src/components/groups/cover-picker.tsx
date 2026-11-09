"use client";

import { useRef, useState } from "react";
import { downscaleImage } from "@/lib/images";
import { IconImage } from "@/components/ui/icons";

/**
 * Selector de portada: reduce la imagen en el navegador y la entrega al
 * formulario mediante `onFile`. Muestra la portada actual si existe.
 */
export function CoverPicker({
  currentUrl,
  onFile,
  error,
  aspect = "aspect-[16/7]",
}: {
  currentUrl?: string | null;
  onFile: (file: File | null) => void;
  error?: string;
  /** Proporción del recuadro (p. ej. «aspect-[2/3]» para libros). */
  aspect?: string;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="label mb-3">Imagen de portada · opcional</p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`relative flex ${aspect} w-full items-center justify-center overflow-hidden rounded-sm border border-dashed border-line-2 bg-surface-2 text-muted transition-colors hover:border-accent-mid hover:text-accent`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local
          <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-sm">
            <IconImage size={26} />
            {busy ? "Procesando…" : "Elegir imagen"}
          </span>
        )}
      </button>
      {preview && (
        <button
          type="button"
          className="btn btn-quiet btn-sm mt-2 -ml-3"
          onClick={() => {
            if (local) URL.revokeObjectURL(local);
            setLocal(null);
            setPreview(currentUrl ?? null);
            onFile(null);
          }}
        >
          {local ? "Descartar imagen nueva" : "Cambiar imagen"}
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-label="Seleccionar imagen de portada"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          try {
            const blob = await downscaleImage(f, { max: 1600 });
            const file = new File([blob], "portada.webp", { type: "image/webp" });
            const url = URL.createObjectURL(blob);
            if (local) URL.revokeObjectURL(local);
            setLocal(url);
            setPreview(url);
            onFile(file);
          } finally {
            setBusy(false);
          }
        }}
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
