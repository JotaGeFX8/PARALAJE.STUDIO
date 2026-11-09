"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

type Change = { table: string; filter?: string };

/**
 * Escucha inserciones en tiempo real (Supabase Realtime, respetando RLS) y,
 * además, sondea cada `pollMs` como respaldo. Si el tiempo real funciona, el
 * sondeo pasa a ser lento; si no está disponible, la app sigue funcionando.
 * Solo sondea con la pestaña visible.
 */
export function useLiveUpdates(key: string, changes: Change[], onChange: () => void, pollMs = 20000) {
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });

  const changesKey = JSON.stringify(changes);

  useEffect(() => {
    let live = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      if (document.visibilityState === "visible") cb.current();
      timer = setTimeout(tick, live ? pollMs * 4 : pollMs);
    };
    timer = setTimeout(tick, pollMs);
    const onVisible = () => document.visibilityState === "visible" && cb.current();
    document.addEventListener("visibilitychange", onVisible);

    let cleanup = () => {};
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        let channel = supabase.channel(`live:${key}`);
        for (const c of JSON.parse(changesKey) as Change[]) {
          channel = channel.on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: c.table, ...(c.filter ? { filter: c.filter } : {}) },
            () => cb.current(),
          );
        }
        channel.subscribe((status) => {
          live = status === "SUBSCRIBED";
        });
        cleanup = () => {
          supabase.removeChannel(channel);
        };
      } catch {
        /* sin tiempo real: queda el sondeo */
      }
    }
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      cleanup();
    };
  }, [key, changesKey, pollMs]);
}
