"use client";

import { useActionState, useRef } from "react";
import { createReportAction } from "@/app/(app)/actions/posts";
import { initialFormState } from "@/lib/form-state";
import { REPORT_REASONS } from "@/lib/content";
import type { ReportTarget } from "@/lib/supabase/types";
import { FormMessage, SubmitButton } from "@/components/forms/fields";
import { IconClose, IconFlag } from "@/components/ui/icons";

/** Botón «Denunciar» con diálogo nativo accesible. */
export function ReportButton({
  targetType,
  targetId,
  label = "Denunciar",
  compact = false,
}: {
  targetType: ReportTarget;
  targetId: string;
  label?: string;
  compact?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action] = useActionState(createReportAction, initialFormState);

  return (
    <>
      <button type="button" className="icon-btn" onClick={() => ref.current?.showModal()}>
        <IconFlag size={compact ? 15 : 17} />
        {compact ? <span className="sr-only">{label}</span> : <span>{label}</span>}
      </button>
      <dialog
        ref={ref}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-line-2 bg-surface p-0 text-ink shadow-xl backdrop:bg-ink/30"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
      >
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-serif text-2xl">Denunciar</h2>
            <button type="button" className="icon-btn -mr-2 -mt-1" onClick={() => ref.current?.close()} aria-label="Cerrar">
              <IconClose size={18} />
            </button>
          </div>
          {state.ok ? (
            <div className="mt-5 space-y-6">
              <FormMessage tone="ok" message={state.message} />
              <button type="button" className="btn btn-ghost" onClick={() => ref.current?.close()}>
                Cerrar
              </button>
            </div>
          ) : (
            <form action={action} className="mt-5 space-y-6">
              <input type="hidden" name="target_type" value={targetType} />
              <input type="hidden" name="target_id" value={targetId} />
              <FormMessage message={state.message} />
              <fieldset>
                <legend className="label mb-3">Motivo</legend>
                <div className="space-y-1">
                  {REPORT_REASONS.map((r) => (
                    <label key={r.key} className="flex cursor-pointer items-center gap-3 py-1.5 text-[0.9375rem] text-ink-2">
                      <input type="radio" name="reason" value={r.key} required />
                      {r.label}
                    </label>
                  ))}
                </div>
                {state.errors?.reason && <p className="mt-2 text-sm text-danger">{state.errors.reason}</p>}
              </fieldset>
              <div>
                <label className="label block" htmlFor={`rep-${targetId}`}>
                  Detalles (opcional)
                </label>
                <textarea id={`rep-${targetId}`} name="details" maxLength={1000} rows={3} className="field" />
              </div>
              <p className="text-xs leading-relaxed text-muted">
                Las denuncias son confidenciales y las revisa una persona del equipo de moderación.
              </p>
              <SubmitButton className="btn btn-primary" pendingLabel="Enviando…">
                Enviar denuncia
              </SubmitButton>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
