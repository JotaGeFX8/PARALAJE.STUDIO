"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPostAction } from "@/app/(app)/actions/posts";
import { initialFormState } from "@/lib/form-state";
import { EPISTEMIC_KINDS } from "@/lib/content";
import { SubmitButton } from "@/components/forms/fields";

/** Publicación rápida del Ágora: escribir y listo; el detalle, opcional. */
export function QuickPost({ name }: { name: string }) {
  const [state, action] = useActionState(createPostAction, initialFormState);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    // Tras publicar, el formulario se pliega (ajuste de estado durante el render).
    setSeen(state);
    if (state.ok) setOpen(false);
  }
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="boxed p-4" onFocus={() => setOpen(true)}>
      <input type="hidden" name="category" value="" />
      <input type="hidden" name="return_to" value="agora" />
      <label htmlFor="agora-body" className="sr-only">
        Publicación rápida
      </label>
      <textarea
        id="agora-body"
        name="body"
        maxLength={20000}
        rows={open ? 4 : 2}
        placeholder={`¿Qué tienes en mente, ${name}? Una pregunta, una idea suelta, un hallazgo…`}
        defaultValue={state.ok ? "" : state.values?.body}
        className="w-full resize-y bg-transparent text-[1.0625rem] leading-relaxed outline-none"
      />
      {open && (
        <div className="mt-3 space-y-4 border-t hairline pt-4">
          <input name="title" maxLength={160} placeholder="Título (opcional)" aria-label="Título (opcional)" className="field !py-2 !text-base" />
          <div className="flex flex-wrap items-center gap-2">
            {EPISTEMIC_KINDS.map((k) => (
              <label key={k.key} className="chip !min-h-8 cursor-pointer !px-3 !text-[0.8125rem]" title={k.description}>
                <input type="radio" name="kind" value={k.key} defaultChecked={k.key === "opinion"} className="sr-only" />
                {k.name}
              </label>
            ))}
            <label className="ml-1 flex cursor-pointer items-center gap-2 text-sm text-ink-2">
              <input type="checkbox" name="is_question" /> Es una pregunta
            </label>
          </div>
          <p className="text-xs text-muted">
            Si eliges «Documentado», añade fuentes desde el{" "}
            <a href="/publicar" className="link">
              editor completo
            </a>
            .
          </p>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p role="status" className={`text-sm ${state.ok ? "text-accent" : "text-danger"}`}>
          {state.ok ? state.message : (state.errors?.body ?? state.errors?.sources ?? state.errors?.title ?? state.message)}
        </p>
        <SubmitButton className="btn btn-primary btn-sm" pendingLabel="Publicando…">
          Publicar
        </SubmitButton>
      </div>
    </form>
  );
}
