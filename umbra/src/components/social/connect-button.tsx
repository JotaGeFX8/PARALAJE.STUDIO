"use client";

import { useState, useTransition } from "react";
import {
  removeConnectionAction,
  respondConnectionAction,
  sendConnectionAction,
  startConversationAction,
} from "@/app/(app)/actions/social";
import { IconConnections, IconMail } from "@/components/ui/icons";

export type ConnectionState = "none" | "sent" | "received" | "connected";

/** Botón de conexión con todos sus estados. */
export function ConnectButton({
  otherId,
  otherName,
  initial,
  size = "md",
}: {
  otherId: string;
  otherName: string;
  initial: ConnectionState;
  size?: "md" | "sm";
}) {
  const [state, setState] = useState(initial);
  const [composing, setComposing] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const sm = size === "sm" ? "btn-sm" : "";

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, next?: ConnectionState) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r.ok && next) setState(next);
      if (!r.ok) setError(r.message ?? "No se pudo completar.");
    });

  if (state === "connected") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending} className={`btn btn-primary ${sm}`} onClick={() => run(() => startConversationAction(otherId))}>
          <IconMail size={17} /> Mensaje
        </button>
        <span className="label text-accent">Conectados</span>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
  if (state === "received") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending} className={`btn btn-primary ${sm}`} onClick={() => run(() => respondConnectionAction(otherId, true), "connected")}>
          Aceptar solicitud
        </button>
        <button type="button" disabled={pending} className={`btn btn-ghost ${sm}`} onClick={() => run(() => respondConnectionAction(otherId, false), "none")}>
          Rechazar
        </button>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
  if (state === "sent") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className={`btn btn-ghost ${sm} pointer-events-none !text-muted`}>Solicitud enviada</span>
        <button type="button" disabled={pending} className="btn btn-quiet btn-sm" onClick={() => run(() => removeConnectionAction(otherId), "none")}>
          Cancelar
        </button>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
  if (composing) {
    return (
      <div className="w-full max-w-md space-y-2">
        <label className="label block" htmlFor={`note-${otherId}`}>
          Cuéntale a {otherName} por qué te gustaría conectar (opcional)
        </label>
        <textarea
          id={`note-${otherId}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          rows={3}
          autoFocus
          className="boxed w-full p-3 text-[0.9375rem] outline-none"
          placeholder="Me interesa tu proyecto de bioconstrucción y vivo cerca…"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            className={`btn btn-primary ${sm}`}
            onClick={() => run(() => sendConnectionAction(otherId, note), "sent")}
          >
            {pending ? "Enviando…" : "Enviar solicitud"}
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setComposing(false)}>
            Cancelar
          </button>
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      </div>
    );
  }
  return (
    <button type="button" className={`btn btn-primary ${sm}`} onClick={() => setComposing(true)}>
      <IconConnections size={17} /> Conectar
    </button>
  );
}
