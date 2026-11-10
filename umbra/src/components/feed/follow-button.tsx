"use client";

import { useState, useTransition } from "react";
import { followAction } from "@/app/(app)/actions/social-feed";

/** Seguir (unilateral, sin solicitud). Distinto de «Conectar», que abre los mensajes privados. */
export function FollowButton({
  profileId,
  initial,
  followsMe = false,
  size = "md",
  onChange,
}: {
  profileId: string;
  initial: boolean;
  followsMe?: boolean;
  size?: "sm" | "md";
  onChange?: (on: boolean) => void;
}) {
  const [on, setOn] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        aria-pressed={on}
        disabled={pending}
        onClick={() => {
          const next = !on;
          setOn(next);
          setError(null);
          onChange?.(next);
          start(async () => {
            const r = await followAction(profileId, next);
            if (!r.ok) {
              setOn(!next);
              onChange?.(!next);
              setError(r.message ?? "No se pudo actualizar.");
            }
          });
        }}
        className={`btn ${size === "sm" ? "btn-sm" : "min-h-11 text-sm"} ${on ? "btn-ghost" : "btn-primary"}`}
      >
        {on ? "Siguiendo" : followsMe ? "Seguir también" : "Seguir"}
      </button>
      {error && <span className="mt-1 text-xs text-danger">{error}</span>}
    </span>
  );
}
