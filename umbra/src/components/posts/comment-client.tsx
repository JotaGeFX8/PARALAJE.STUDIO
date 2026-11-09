"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createCommentAction, deleteCommentAction, editCommentAction } from "@/app/(app)/actions/posts";
import { initialFormState } from "@/lib/form-state";
import { SubmitButton } from "@/components/forms/fields";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ReportButton } from "@/components/moderation/report-button";
import { ReactionBar, type ReactionCounts } from "./reaction-bar";
import { IconComment, IconEdit, IconTrash } from "@/components/ui/icons";

/** Formulario de comentario (raíz o respuesta). */
export function CommentForm({
  postId,
  parentId,
  autoFocus = false,
  onDone,
  placeholder = "Aporta a la conversación…",
}: {
  postId: string;
  parentId?: string;
  autoFocus?: boolean;
  onDone?: () => void;
  placeholder?: string;
}) {
  const [state, action] = useActionState(createCommentAction, initialFormState);
  const ref = useRef<HTMLFormElement>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });
  useEffect(() => {
    if (!state.ok) return;
    ref.current?.reset();
    onDoneRef.current?.();
  }, [state]);

  return (
    <form ref={ref} action={action} className="boxed p-3">
      <input type="hidden" name="post_id" value={postId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <textarea
        name="body"
        required
        maxLength={5000}
        rows={parentId ? 2 : 3}
        autoFocus={autoFocus}
        defaultValue={state.ok ? "" : state.values?.body}
        placeholder={placeholder}
        aria-label={parentId ? "Tu respuesta" : "Tu comentario"}
        className="w-full resize-y bg-transparent px-1 py-1 text-[0.9375rem] leading-relaxed outline-none"
      />
      <div className="flex items-center justify-between gap-3 pt-2">
        <p role="alert" className="text-xs text-danger">
          {state.errors?.body ?? state.message}
        </p>
        <div className="flex items-center gap-2">
          {onDone && (
            <button type="button" className="btn btn-quiet btn-sm" onClick={onDone}>
              Cancelar
            </button>
          )}
          <SubmitButton className="btn btn-primary btn-sm" pendingLabel="Enviando…">
            {parentId ? "Responder" : "Comentar"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}

/** Acciones de un comentario: reacciones, responder, editar, eliminar, denunciar. */
export function CommentControls({
  postId,
  commentId,
  body,
  reactions,
  canReply,
  canEdit,
  canDelete,
  canReport,
}: {
  postId: string;
  commentId: string;
  body: string;
  reactions: ReactionCounts;
  canReply: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canReport: boolean;
}) {
  const [mode, setMode] = useState<"idle" | "reply" | "edit">("idle");
  const [text, setText] = useState(body);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div>
      {mode === "edit" ? (
        <div className="boxed mt-2 p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={5000}
            rows={3}
            aria-label="Editar comentario"
            className="w-full resize-y bg-transparent px-1 text-[0.9375rem] leading-relaxed outline-none"
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            {error && <span className="mr-auto text-xs text-danger">{error}</span>}
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setMode("idle")}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={pending}
              className="btn btn-primary btn-sm"
              onClick={() =>
                start(async () => {
                  const r = await editCommentAction(commentId, text);
                  if (r.ok) setMode("idle");
                  else setError(r.message ?? "No se pudo guardar.");
                })
              }
            >
              Guardar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-1 flex flex-wrap items-center gap-0.5 -ml-2">
          <ReactionBar target="comment" id={commentId} initial={reactions} compact />
          {canReply && (
            <button type="button" className="icon-btn" onClick={() => setMode(mode === "reply" ? "idle" : "reply")}>
              <IconComment size={15} /> Responder
            </button>
          )}
          {canEdit && (
            <button type="button" className="icon-btn" onClick={() => setMode("edit")}>
              <IconEdit size={15} /> <span className="sr-only sm:not-sr-only">Editar</span>
            </button>
          )}
          {canDelete && (
            <ConfirmButton onConfirm={() => deleteCommentAction(commentId)} confirmLabel="Eliminar">
              <IconTrash size={15} /> <span className="sr-only sm:not-sr-only">Eliminar</span>
            </ConfirmButton>
          )}
          {canReport && <ReportButton targetType="comment" targetId={commentId} compact />}
        </div>
      )}
      {mode === "reply" && (
        <div className="mt-3">
          <CommentForm postId={postId} parentId={commentId} autoFocus onDone={() => setMode("idle")} placeholder="Tu respuesta…" />
        </div>
      )}
    </div>
  );
}
