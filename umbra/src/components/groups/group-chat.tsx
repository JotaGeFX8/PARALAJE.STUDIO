"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { deleteGroupMessageAction, fetchGroupMessagesAction, sendGroupMessageAction } from "@/app/(app)/actions/groups";
import type { GroupMessage } from "@/lib/data/circles";
import { useLiveUpdates } from "@/lib/realtime";
import { formatDate, formatTime } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { RichText } from "@/components/ui/rich-text";
import { ReportButton } from "@/components/moderation/report-button";
import { IconSend } from "@/components/ui/icons";

/**
 * Conversación de grupo: chat de un círculo o espacio de conversación de un proyecto.
 * En proyectos, quienes participan pueden marcar un mensaje como «novedad».
 */
export function GroupChat({
  kind,
  groupId,
  me,
  initial,
  canWrite,
  canPostUpdate = false,
  canModerate = false,
  placeholder = "Escribe al grupo…",
  emptyText,
}: {
  kind: "circle" | "project";
  groupId: string;
  me: string;
  initial: GroupMessage[];
  canWrite: boolean;
  canPostUpdate?: boolean;
  canModerate?: boolean;
  placeholder?: string;
  emptyText: string;
}) {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const lastAt = useRef(initial.at(-1)?.created_at ?? new Date(0).toISOString());
  const end = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const merge = useCallback((incoming: GroupMessage[]) => {
    if (!incoming.length) return;
    setMessages((cur) => {
      const ids = new Set(cur.map((m) => m.id));
      const fresh = incoming.filter((m) => !ids.has(m.id));
      return fresh.length ? [...cur, ...fresh] : cur;
    });
    lastAt.current = incoming.at(-1)!.created_at;
  }, []);

  const pull = useCallback(() => {
    fetchGroupMessagesAction(kind, groupId, lastAt.current).then(merge).catch(() => {});
  }, [kind, groupId, merge]);

  useLiveUpdates(
    `${kind}:${groupId}`,
    [{ table: `${kind}_messages`, filter: `${kind}_id=eq.${groupId}` }],
    pull,
    kind === "circle" ? 6000 : 15000,
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (kind === "project") return; // en proyectos, la conversación no roba el foco al abrir
    }
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, kind]);

  function send() {
    const body = text.trim();
    if (!body) return;
    setError(null);
    start(async () => {
      const r = await sendGroupMessageAction(kind, groupId, body, isUpdate);
      if (r.ok && r.row) {
        merge([r.row]);
        setText("");
        setIsUpdate(false);
      } else setError(r.message ?? "No se pudo enviar.");
    });
  }

  return (
    <div>
      <ol className="space-y-1" aria-live="polite">
        {messages.length === 0 && <li className="py-8 font-serif text-lg text-muted">{emptyText}</li>}
        {messages.map((m, i) => {
          const day = formatDate(m.created_at);
          const showDay = i === 0 || formatDate(messages[i - 1].created_at) !== day;
          const sameAuthor = !showDay && i > 0 && messages[i - 1].sender_id === m.sender_id && !m.is_update;
          const name = m.sender?.display_name ?? m.sender?.username ?? "Miembro";
          const mine = m.sender_id === me;
          return (
            <li key={m.id}>
              {showDay && <p className="label my-5">{day}</p>}
              <article
                className={`group flex gap-3 rounded-sm px-2 py-1.5 ${m.is_update ? "my-2 border-l-2 border-accent bg-accent-faint py-3" : ""}`}
              >
                <span className="w-9 shrink-0">
                  {!sameAuthor && (
                    <Link href={`/miembros/${m.sender?.username}`}>
                      <Avatar url={m.sender?.avatar_url} name={name} size={34} />
                    </Link>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  {!sameAuthor && (
                    <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <Link href={`/miembros/${m.sender?.username}`} className="font-medium text-ink hover:text-accent">
                        {name}
                      </Link>
                      <time className="text-xs text-muted" dateTime={m.created_at}>
                        {formatTime(m.created_at)}
                      </time>
                      {m.is_update && <span className="label !text-[0.625rem] text-accent">Novedad del proyecto</span>}
                    </p>
                  )}
                  {m.deleted_at ? (
                    <p className="text-[0.9375rem] italic text-muted">Mensaje eliminado</p>
                  ) : (
                    <RichText text={m.body} className="prose-doc !text-[0.96rem] [&_p]:!mb-1.5" />
                  )}
                </div>
                {!m.deleted_at && (
                  <span className="shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                    {mine || canModerate ? (
                      <button
                        type="button"
                        className="icon-btn !px-1.5 text-xs"
                        onClick={() =>
                          start(async () => {
                            const r = await deleteGroupMessageAction(kind, m.id);
                            if (r.ok)
                              setMessages((cur) =>
                                cur.map((x) => (x.id === m.id ? { ...x, deleted_at: new Date().toISOString() } : x)),
                              );
                          })
                        }
                      >
                        Borrar
                      </button>
                    ) : (
                      <ReportButton targetType="message" targetId={m.id} compact />
                    )}
                  </span>
                )}
              </article>
            </li>
          );
        })}
        <div ref={end} />
      </ol>

      {canWrite ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="boxed mt-5 p-2"
        >
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && kind === "circle") {
                  e.preventDefault();
                  send();
                }
              }}
              maxLength={kind === "circle" ? 2000 : 4000}
              rows={kind === "circle" ? 1 : 2}
              placeholder={placeholder}
              aria-label={placeholder}
              className="max-h-48 min-h-11 w-full resize-y bg-transparent px-2 py-2.5 text-[0.9375rem] outline-none"
            />
            <button type="submit" disabled={pending || !text.trim()} className="btn btn-primary btn-sm !min-h-11" aria-label="Enviar">
              <IconSend size={18} />
            </button>
          </div>
          {canPostUpdate && (
            <label className="mt-1 flex cursor-pointer items-center gap-2 px-2 pb-1 text-xs text-muted">
              <input type="checkbox" checked={isUpdate} onChange={(e) => setIsUpdate(e.target.checked)} />
              Publicar como novedad (avisa a quienes participan)
            </label>
          )}
        </form>
      ) : null}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
