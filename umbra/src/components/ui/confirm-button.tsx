"use client";

import { useState, useTransition } from "react";

/** Acción destructiva en dos pasos: primero pide confirmación. */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = "¿Seguro? Confirmar",
  className = "icon-btn",
}: {
  onConfirm: () => Promise<{ ok: boolean; message?: string } | void>;
  children: React.ReactNode;
  confirmLabel?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      {armed ? (
        <>
          <button
            type="button"
            disabled={pending}
            className={`${className} !text-danger`}
            onClick={() =>
              start(async () => {
                const res = await onConfirm();
                if (res && !res.ok) setError(res.message ?? "No se pudo completar.");
                setArmed(false);
              })
            }
          >
            {pending ? "Un momento…" : confirmLabel}
          </button>
          <button type="button" className="icon-btn" onClick={() => setArmed(false)}>
            Cancelar
          </button>
        </>
      ) : (
        <button type="button" className={className} onClick={() => setArmed(true)}>
          {children}
        </button>
      )}
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </span>
  );
}
