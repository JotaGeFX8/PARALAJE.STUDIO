"use client";

import { useActionState } from "react";
import { saveNotificationPrefsAction } from "@/app/(app)/actions/social";
import { initialFormState } from "@/lib/form-state";
import { FormMessage, SubmitButton } from "@/components/forms/fields";

const ITEMS = [
  ["comments", "Comentarios en publicaciones que sigo"],
  ["replies", "Respuestas a mis comentarios"],
  ["mentions", "Menciones (@usuario)"],
  ["connections", "Solicitudes y conexiones aceptadas"],
  ["messages", "Mensajes privados"],
  ["circles", "Invitaciones y solicitudes de círculos"],
  ["projects", "Actividad en mis proyectos"],
  ["follows", "Nuevos seguidores"],
  ["reactions", "«Me gusta» en mis publicaciones"],
] as const;

export function NotificationPrefsForm({ prefs }: { prefs: Record<(typeof ITEMS)[number][0], boolean> }) {
  const [state, action] = useActionState(saveNotificationPrefsAction, initialFormState);
  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state.message} tone={state.ok ? "ok" : "error"} />
      <div className="space-y-2.5">
        {ITEMS.map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-3 text-[0.9375rem] text-ink-2">
            <input type="checkbox" name={key} defaultChecked={prefs[key]} />
            {label}
          </label>
        ))}
      </div>
      <p className="text-xs text-muted">Los avisos se muestran dentro de la web. No enviamos correos de actividad.</p>
      <SubmitButton className="btn btn-ghost" pendingLabel="Guardando…">
        Guardar preferencias
      </SubmitButton>
    </form>
  );
}
