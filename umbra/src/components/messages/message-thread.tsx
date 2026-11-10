"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { deleteMessageAction, fetchMessagesAction, sendMessageAction, type SentMessage } from "@/app/(app)/actions/social";
import { useLiveUpdates } from "@/lib/realtime";
import { formatDate, formatTime } from "@/lib/format";
import { ReportButton } from "@/components/moderation/report-button";
import { IconSend } from "@/components/ui/icons";

/** Conversación privada: historial, envío y actualización en tiempo real. */
export function MessageThread({
  conversationId,
  me,
  otherName,
  initial,
  canWrite,
}: {
  conversationId: string;
  me: string;
  otherName: string;
  initial: SentMessage[];
  canWrite: boolean;
}) {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const lastAt = useRef(initial.at(-1)?.created_at ?? new Date(0).toISOString());

  const merge = useCallback((incoming: SentMessage[]) => {
    if (!incoming.length) return;
    setMessages((cur) => {
      const ids = new Set(cur.map((m) => m.id));
      const fresh = incoming.filter((m) => !ids.has(m.id));
      return fresh.length ? [...cur, ...fresh] : cur;
    });
    lastAt.current = incoming.at(-1)!.created_at;
  }, []);

  const pull = useCallback(() => {
    fetchMessagesAction(conversationId, lastAt.current).then(merge).catch(() => {});
  }, [conversationId, merge]);

  useLiveUpdates(`chat:${conversationId}`, [{ table: "messages", filter: `conversation_id=eq.${conversationId}` }], pull, 5000);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function send() {
    const body = text.trim();
    if (!body) return;
    setError(null);
    start(async () => {
      const r = await sendMessageAction(conversationId, body);
      if (r.ok && r.message_row) {
        merge([r.message_row]);
        setText("");
      } else setError(r.message ?? "No se pudo enviar.");
    });
  }

  return (
    <div className="flex min-h-[60dvh] flex-col">
      <ol className="flex-1 space-y-1.5 pb-4" aria-live="polite">
        {messages.length === 0 && (
          <li className="py-10 text-center font-serif text-lg text-muted">Aún no hay mensajes. Saluda a {otherName}.</li>
        )}
        {messages.map((m, i) => {
          const day = formatDate(m.created_at);
          const showDay = i === 0 || formatDate(messages[i - 1].created_at) !== day;
          const mine = m.sender_id === me;
          return (
            <li key={m.id}>
              {showDay && <p className="label my-5 text-center">{day}</p>}
              <div className={`group flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-relaxed sm:max-w-[70%] ${
                    mine ? "rounded-br-sm bg-accent text-on-accent" : "rounded-bl-sm bg-surface-2 text-ink"
                  } ${m.deleted_at ? "italic opacity-60" : ""}`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.deleted_at ? "Mensaje eliminado" : m.body}</p>
                  <p className={`mt-1 text-right font-mono text-[0.625rem] ${mine ? "text-on-accent/70" : "text-muted"}`}>
                    <time dateTime={m.created_at}>{formatTime(m.created_at)}</time>
                  </p>
                </div>
                {!m.deleted_at && (
                  <span className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                    {mine ? (
                      <button
                        type="button"
                        className="icon-btn !px-1.5 text-xs"
                        onClick={() =>
                          start(async () => {
                            const r = await deleteMessageAction(m.id);
                            if (r.ok)
                              setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...x, deleted_at: new Date().toISOString() } : x)));
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
              </div>
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
          className="boxed sticky bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom)+0.5rem)] flex items-end gap-2 p-2 md:bottom-4"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            maxLength={4000}
            rows={1}
            aria-label={`Mensaje para ${otherName}`}
            placeholder="Escribe un mensaje…"
            className="max-h-40 min-h-11 w-full resize-none bg-transparent px-2 py-2.5 text-[0.9375rem] outline-none"
          />
          <button type="submit" disabled={pending || !text.trim()} className="btn btn-primary btn-sm !min-h-11" aria-label="Enviar">
            <IconSend size={18} />
          </button>
        </form>
      ) : (
        <p className="rounded-xl bg-surface-2 p-4 text-sm text-ink-2">
          No podéis escribiros ahora: la conexión ya no existe o hay un bloqueo. El historial se conserva.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
