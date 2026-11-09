"use client";

import { useEffect } from "react";

/** Error inesperado dentro de la zona privada: mensaje claro y reintento. */
export default function ShellError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="max-w-xl py-10">
      <p className="label">Algo ha fallado</p>
      <h1 className="display mt-4 text-4xl text-ink">No hemos podido cargar esta página.</h1>
      <p className="mt-4 font-serif text-lg leading-relaxed text-ink-2">
        Puede ser un problema momentáneo de conexión. Si se repite, avísanos desde el Ágora.
      </p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">
        Reintentar
      </button>
    </div>
  );
}
